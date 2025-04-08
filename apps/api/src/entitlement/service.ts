import { env } from "cloudflare:workers"
import type { Database } from "@unprice/db"
import { Err, type FetchError, Ok, type Result } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Cache, CustomerEntitlementCache, SubcriptionCache } from "@unprice/services/cache"
import { CustomerService } from "@unprice/services/customers"
import { UnPriceCustomerError } from "@unprice/services/customers"
import type { Metrics } from "@unprice/services/metrics"
import type { Analytics } from "@unprice/tinybird"
import type { DurableObjectUsagelimiter } from "./do"
import type {
  CanRequest,
  CanResponse,
  EntitlementLimiter,
  GetEntitlementsRequest,
  GetEntitlementsResponse,
  ReportUsageRequest,
  ReportUsageResponse,
} from "./interface"

export class EntitlementService implements EntitlementLimiter {
  private readonly namespace: DurableObjectNamespace<DurableObjectUsagelimiter>
  private readonly logger: Logger
  private readonly metrics: Metrics
  private readonly analytics: Analytics
  private readonly cache: Cache
  private readonly db: Database
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private readonly waitUntil: (promise: Promise<any>) => void
  private readonly customerService: CustomerService

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

    this.customerService = new CustomerService({
      logger: this.logger,
      analytics: this.analytics,
      waitUntil: this.waitUntil,
      cache: this.cache,
      metrics: this.metrics,
      db: this.db,
    })
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

  private async getActiveEntitlementFromDO(
    customerId: string,
    featureSlug: string
  ): Promise<Result<CustomerEntitlementCache | null, FetchError | UnPriceCustomerError>> {
    const durableObject = this.getStub(this.getDurableObjectCustomerId(customerId))
    const entitlement = await durableObject.getEntitlement(featureSlug)

    if (!entitlement) {
      return Ok(null)
    }

    const { id, entitlementId, ...rest } = entitlement

    return Ok({
      ...rest,
      id: entitlementId,
      active: entitlement.active === 1,
      realtime: entitlement.realtime === 1,
      isCustom: entitlement.isCustom === 1,
    })
  }

  public async revalidateEntitlement(
    customerId: string,
    featureSlug: string,
    projectId: string,
    now: number
  ): Promise<Result<CustomerEntitlementCache | null, FetchError | UnPriceCustomerError>> {
    const { err: entitlementErr, val: entitlement } =
      await this.customerService.getActiveEntitlement(customerId, featureSlug, projectId, now, {
        skipCache: true, // skip cache to force revalidation
        withLastUsage: true, // get the last usage from analytics
      })

    if (entitlementErr) {
      return Err(entitlementErr)
    }

    if (!entitlement) {
      return Ok(null)
    }

    const durableObject = this.getStub(this.getDurableObjectCustomerId(customerId))

    const { id, ...rest } = entitlement

    const data = {
      ...rest,
      entitlementId: id,
      metadata: JSON.stringify(rest.metadata),
      isCustom: rest.isCustom ? 1 : 0,
      active: rest.active ? 1 : 0,
      realtime: rest.realtime ? 1 : 0,
    }

    await durableObject.setEntitlement(data)

    return Ok({
      ...rest,
      id,
      active: data.active === 1,
      realtime: data.realtime === 1,
      isCustom: data.isCustom === 1,
    })
  }

  private async validateSubscription(
    customerId: string,
    projectId: string
  ): Promise<Result<SubcriptionCache | null, FetchError | UnPriceCustomerError>> {
    const { err: subscriptionErr, val: subscription } =
      await this.customerService.getActiveSubscription(customerId, projectId)

    if (subscriptionErr) {
      return Err(subscriptionErr)
    }

    if (!subscription) {
      return Err(
        new UnPriceCustomerError({
          code: "CUSTOMER_SUBSCRIPTION_NOT_FOUND",
          message: "customer has no active subscription",
        })
      )
    }

    return Ok(subscription)
  }

  public async resetEntitlements(
    customerId: string,
    projectId: string
  ): Promise<{
    success: boolean
    message: string
  }> {
    const { err: subscriptionErr } = await this.validateSubscription(customerId, projectId)

    if (subscriptionErr) {
      return { success: false, message: subscriptionErr.message }
    }

    const durableObject = this.getStub(this.getDurableObjectCustomerId(customerId))

    const result = await durableObject.resetDO()

    if (!result.success) {
      return { success: false, message: result.message }
    }

    const keys = result.slugs?.map((slug) => `${customerId}:${slug}`)

    // delete the cache
    this.waitUntil(
      Promise.all([
        this.cache.customerEntitlement.remove(keys ?? []),
        this.cache.customerSubscription.remove(customerId),
      ])
    )

    return { success: true, message: "customer object deleted" }
  }

  public async can(data: CanRequest): Promise<CanResponse> {
    const { err: subscriptionErr } = await this.validateSubscription(
      data.customerId,
      data.projectId
    )

    if (subscriptionErr) {
      return {
        success: false,
        message: subscriptionErr.message,
        deniedReason: subscriptionErr.code as CanResponse["deniedReason"],
      }
    }

    // Fast path: read from DO
    const { err: entitlementErr, val: entitlement } = await this.getActiveEntitlementFromDO(
      data.customerId,
      data.featureSlug
    )

    if (entitlementErr) {
      return { success: false, message: entitlementErr.message }
    }

    // not found in DO, we need to revalidate the entitlement
    if (!entitlement) {
      // revalidate the entitlement
      const { err: revalidateErr } = await this.revalidateEntitlement(
        data.customerId,
        data.featureSlug,
        data.projectId,
        data.now
      )

      if (revalidateErr) {
        return {
          success: false,
          message: revalidateErr.message,
          deniedReason: "ENTITLEMENT_NOT_FOUND",
        }
      }
    }

    // after this point we can report the verification event
    const durableObject = this.getStub(this.getDurableObjectCustomerId(data.customerId))

    const result = await durableObject.can(data)

    return result
  }

  public async reportUsage(data: ReportUsageRequest): Promise<ReportUsageResponse> {
    try {
      const { err: subscriptionErr } = await this.validateSubscription(
        data.customerId,
        data.projectId
      )

      if (subscriptionErr) {
        return { success: false, message: subscriptionErr.message }
      }

      // in dev we use the idempotence key and timestamp to deduplicate reuse the same key for the same request
      const idempotentKey =
        env.NODE_ENV === "production"
          ? `${data.idempotenceKey}`
          : `${data.idempotenceKey}:${data.now}`

      // Fast path: check if the event has already been sent to the DO
      const { val: sent } = await this.cache.idempotentRequestUsageByHash.get(idempotentKey)

      // if the usage is already sent, return the result
      if (sent) {
        return sent
      }

      // Fast path: get the entitlement from the cache
      const { err: entitlementErr, val } = await this.getActiveEntitlementFromDO(
        data.customerId,
        data.featureSlug
      )

      let entitlement = val
      if (entitlementErr) {
        return { success: false, message: entitlementErr.message }
      }

      if (!entitlement) {
        // revalidate the entitlement
        const { err: revalidateErr, val: revalidatedEntitlement } =
          await this.revalidateEntitlement(
            data.customerId,
            data.featureSlug,
            data.projectId,
            data.now
          )

        if (revalidateErr) {
          return { success: false, message: revalidateErr.message }
        }

        entitlement = revalidatedEntitlement
      }

      // Report usage path: send the usage to the DO
      const d = this.getStub(this.getDurableObjectCustomerId(data.customerId))
      const result = await d.reportUsage(data)

      const response = {
        success: result.success,
        message: result.message,
        limit: Number(result.limit),
        usage: Number(result.usage),
        notifyUsage: result.notifyUsage,
      }

      this.waitUntil(
        // cache the result for the next time
        // update the cache with the new usage so we can check limit in the next request
        // without calling the DO again
        Promise.all([
          this.cache.idempotentRequestUsageByHash.set(idempotentKey, response),
          entitlement &&
            this.cache.customerEntitlement.set(`${data.customerId}:${data.featureSlug}`, {
              ...entitlement,
              usage: result.usage?.toString() ?? "0",
            }),
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

  public async getEntitlements(req: GetEntitlementsRequest): Promise<GetEntitlementsResponse> {
    const { customerId, projectId, now } = req

    const { err: subscriptionErr } = await this.validateSubscription(customerId, projectId)

    if (subscriptionErr) {
      throw subscriptionErr
    }

    const { err: entitlementsErr, val: entitlements } =
      await this.customerService.getActiveEntitlements({
        customerId,
        projectId,
        now,
      })

    if (entitlementsErr) {
      throw entitlementsErr
    }

    if (!entitlements) {
      throw new UnPriceCustomerError({
        code: "CUSTOMER_ENTITLEMENTS_NOT_FOUND",
        message: "customer has no entitlements",
      })
    }

    return {
      entitlements,
    }
  }
}
