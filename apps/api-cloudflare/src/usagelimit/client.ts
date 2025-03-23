import { env } from "cloudflare:workers"
import { type Database, and, eq } from "@unprice/db"
import { subscriptions } from "@unprice/db/schema"
import { Err, FetchError, Ok, type Result } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import type { Cache, SubcriptionCache } from "~/cache"
import type { Entitlement } from "~/db/types"
import type { Metrics } from "~/metrics/interface"
import type { DurableObjectUsagelimiter } from "./do"
import type { CanRequest, ReportUsageRequest, ReportUsageResponse, UsageLimiter } from "./interface"

export class DurableUsageLimiter implements UsageLimiter {
  private readonly namespace: DurableObjectNamespace<DurableObjectUsagelimiter>
  private readonly logger: Logger
  private readonly metrics: Metrics
  private readonly analytics: Analytics
  private readonly cache: Cache
  private readonly db: Database
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private readonly waitUntil: (promise: Promise<any>) => void

  constructor(opts: {
    namespace: DurableObjectNamespace<DurableObjectUsagelimiter>
    requestId: string
    domain?: string
    logger: Logger
    metrics: Metrics
    analytics: Analytics
    cache: Cache
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    waitUntil: (promise: Promise<any>) => void
    db: Database
  }) {
    this.namespace = opts.namespace
    this.logger = opts.logger
    this.metrics = opts.metrics
    this.analytics = opts.analytics
    this.cache = opts.cache
    this.db = opts.db
    this.waitUntil = opts.waitUntil
  }

  private getStub(
    name: string,
    locationHint?: DurableObjectLocationHint
  ): DurableObjectStub<DurableObjectUsagelimiter> {
    return this.namespace.get(this.namespace.idFromName(name), {
      locationHint,
    })
  }

  private getDurableObjectCustomerId(customerId: string): string {
    // later on we can shard this by customer and feature slug if needed
    return `${customerId}`
  }

  private async getSubscription(customerId: string): Promise<Result<SubcriptionCache, FetchError>> {
    // swr handle cache stampede of us :)
    const { val, err } = await this.cache.customerSubscription.swr(customerId, async () => {
      const subscription = await this.db.query.subscriptions.findFirst({
        with: {
          customer: true,
        },
        where: and(eq(subscriptions.customerId, customerId), eq(subscriptions.active, true)),
      })

      // return explicitly null to avoid cache miss
      // this is useful to avoid cache revalidation on keys that don't exist
      if (!subscription) {
        return null
      }

      if (subscription.customer.active === false) {
        return null
      }

      // don't return the whole subscription, just the fields we need
      return {
        id: subscription.id,
        projectId: subscription.projectId,
        customerId: subscription.customerId,
        active: subscription.active,
        status: subscription.status,
        planSlug: subscription.planSlug,
        currentCycleStartAt: subscription.currentCycleStartAt,
        currentCycleEndAt: subscription.currentCycleEndAt,
      }
    })

    if (err) {
      this.logger.error("error getting customer", {
        error: err.message,
      })
    }

    return Ok(val ?? null)
  }

  private async getEntitlement(
    customerId: string,
    featureSlug: string,
    projectId: string
  ): Promise<Result<Entitlement | null, FetchError>> {
    const { val, err } = await this.cache.customerEntitlement.swr(
      `${customerId}:${featureSlug}`,
      async () => {
        // we revalidate against the durable object
        const durableObject = this.getStub(this.getDurableObjectCustomerId(customerId))
        const entitlement = await durableObject.getEntitlement(featureSlug)

        if (!entitlement) {
          return null
        }

        return entitlement
      }
    )

    if (err) {
      this.logger.error("error getting entitlement", {
        error: err.message,
        customerId,
        featureSlug,
        projectId,
      })

      return Err(
        new FetchError({
          message: err.message,
          retry: true,
          cause: err,
        })
      )
    }

    return Ok(val ?? null)
  }

  public async deleteCustomer(customerId: string): Promise<{
    success: boolean
    message: string
  }> {
    const { err: subscriptionErr, val: subscription } = await this.getSubscription(customerId)

    if (subscriptionErr) {
      return { success: false, message: subscriptionErr.message }
    }

    if (!subscription) {
      return { success: false, message: "customer has no active subscription" }
    }

    const durableObject = this.getStub(this.getDurableObjectCustomerId(customerId))

    const result = await durableObject.resetDO()

    if (!result.success) {
      return { success: false, message: result.message }
    }

    // delete the cache
    this.waitUntil(
      Promise.all([
        this.cache.customerEntitlement.remove(`${customerId}:*`),
        this.cache.customerSubscription.remove(customerId),
      ])
    )

    return { success: true, message: "customer object deleted" }
  }

  async revalidateEntitlement(
    customerId: string,
    featureSlug: string
  ): Promise<{
    success: boolean
    message: string
  }> {
    const { err: subscriptionErr, val: subscription } = await this.getSubscription(customerId)

    if (subscriptionErr) {
      return { success: false, message: subscriptionErr.message }
    }

    if (!subscription) {
      return { success: false, message: "customer has no active subscription" }
    }

    const durableObject = this.getStub(this.getDurableObjectCustomerId(customerId))

    const result = await durableObject.revalidateEntitlement({
      customerId,
      featureSlug,
      projectId: subscription.projectId,
      now: Date.now(),
      forceRevalidate: true,
    })

    if (!result.success) {
      return { success: false, message: result.message }
    }

    return { success: true, message: "entitlement revalidated" }
  }

  public async can(data: CanRequest): Promise<{
    success: boolean
    message: string
  }> {
    const { err: subscriptionErr, val: subscription } = await this.getSubscription(data.customerId)

    if (subscriptionErr) {
      return { success: false, message: subscriptionErr.message }
    }

    if (!subscription) {
      return { success: false, message: "customer has no active subscription" }
    }

    // Fast path: check if the limit is reached in the cache
    const { err: entitlementErr, val: entitlement } = await this.getEntitlement(
      data.customerId,
      data.featureSlug,
      data.projectId
    )

    if (entitlementErr) {
      return { success: false, message: entitlementErr.message }
    }

    if (!entitlement) {
      return { success: false, message: "entitlement not found" }
    }

    // TODO: we could avoid call the DO if the limit is reached but we still need to report the verification
    const durableObject = this.getStub(this.getDurableObjectCustomerId(data.customerId))

    const result = await durableObject.can(data)

    if (!result.success) {
      return { success: false, message: result.message }
    }

    return { success: true, message: result.message }
  }

  public async reportUsage(data: ReportUsageRequest): Promise<ReportUsageResponse> {
    try {
      // Good to know: DO is generally in the same region as the customer
      // customer can decide where to deploy the DO with locationHint
      // by default we let cloudflare decide the best location

      // this is not ideal but we need to validate the customer exists to avoid
      // reporting usage to a non existing customer or creating DOs for non existing customers
      const { err: subscriptionErr, val: subscription } = await this.getSubscription(
        data.customerId
      )

      if (subscriptionErr) {
        return { success: false, message: subscriptionErr.message }
      }

      if (!subscription) {
        return { success: false, message: "customer has no active subscription" }
      }

      // in dev we use the idempotence key and timestamp to deduplicate so we can test the usage
      const idempotentKey =
        env.NODE_ENV === "production"
          ? `${data.idempotenceKey}`
          : `${data.idempotenceKey}:${data.date}`

      // Fast path: check if the event has already been sent to the DO
      const { val: sent } = await this.cache.idempotentRequestUsageByHash.get(idempotentKey)

      // if the usage is already sent, return the result
      // TODO: remove this once we have a way to track the usage
      if (sent && env.NODE_ENV === "production") {
        return sent
      }

      // Fast path: check if the limit is reached in the cache
      const { err: entitlementErr, val: entitlement } = await this.getEntitlement(
        data.customerId,
        data.featureSlug,
        data.projectId
      )

      if (entitlementErr) {
        return { success: false, message: entitlementErr.message }
      }

      if (!entitlement) {
        return { success: false, message: "entitlement not found" }
      }

      // TODO: should we report the usage even if the entitlement is expired?
      // TODO: should we report the usage even if the entitlement has reached the limit?
      if (entitlement) {
        // check if the entitlement has expired
        const validUntil = entitlement.validTo + entitlement.bufferPeriodDays * 24 * 60 * 60 * 1000

        if (data.date > validUntil) {
          return { success: false, message: "entitlement expired" }
        }

        // if feature type is flat, we don't need to call the DO
        if (entitlement.featureType === "flat") {
          return {
            success: true,
            message:
              "feature is flat, limit is not applicable but events are billed. Please don't report usage for flat features to avoid overbilling.",
          }
        }

        // it's a valid entitlement
        // check if the usage is over the limit
        // TODO: here calculattion is not correct, we should use the aggregation method
        if (Number(entitlement.usage) + data.usage > Number(entitlement.limit)) {
          return {
            success: false,
            message: "usage over the limit",
            usage: Number(entitlement.usage),
            limit: Number(entitlement.limit),
          }
        }
      }

      // Report usage path: send the usage to the DO
      const d = this.getStub(this.getDurableObjectCustomerId(data.customerId))
      const result = await d.reportUsage(data)

      if (!result.success) {
        return result
      }

      const response = {
        success: result.success,
        message: result.message,
        limit: Number(result.entitlement?.limit),
        usage: Number(result.entitlement?.usage),
        notifyUsage: result.notifyUsage,
      }

      // cache the result for the next time
      this.waitUntil(
        Promise.all([
          this.cache.idempotentRequestUsageByHash.set(idempotentKey, response),
          result.entitlement &&
            this.cache.customerEntitlement.set(
              `${data.customerId}:${data.featureSlug}`,
              result.entitlement
            ),
        ])
      )

      return response
    } catch (e) {
      console.error("usagelimit failed", {
        customerId: data.customerId,
        error: (e as Error).message,
      })
      return { success: false, message: "usage limit failed" }
    } finally {
    }
  }
}
