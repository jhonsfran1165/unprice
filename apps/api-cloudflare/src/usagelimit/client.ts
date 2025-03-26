import { env } from "cloudflare:workers"
import { type Database, and, eq, gte, lte } from "@unprice/db"
import {
  customerEntitlements,
  features,
  planVersionFeatures,
  subscriptions,
} from "@unprice/db/schema"
import type { AggregationMethod } from "@unprice/db/validators"
import { Err, FetchError, Ok, type Result, wrapResult } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import type { Cache, CustomerEntitlementCache, SubcriptionCache } from "~/cache"
import { type DenyReason, UnPriceCustomerError } from "~/errors"
import type { Metrics } from "~/metrics/interface"
import { retry } from "~/util/retry"
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

  private async getActiveSubscriptionData({
    customerId,
    projectId,
    now,
  }: {
    customerId: string
    projectId: string
    now: number
  }): Promise<SubcriptionCache | null> {
    const subscription = await this.db.query.subscriptions
      .findFirst({
        with: {
          customer: {
            columns: {
              active: true,
            },
          },
          project: {
            columns: {
              enabled: true,
            },
          },
        },
        where: and(
          eq(subscriptions.customerId, customerId),
          eq(subscriptions.active, true),
          eq(subscriptions.projectId, projectId),
          gte(subscriptions.currentCycleEndAt, now),
          lte(subscriptions.currentCycleStartAt, now)
        ),
      })
      .catch((e) => {
        console.error("error getting active subscription data", e)
        return null
      })

    // return explicitly null to avoid cache miss
    // this is useful to avoid cache revalidation on keys that don't exist
    if (!subscription) {
      return null
    }

    const result = {
      id: subscription.id,
      projectId: subscription.projectId,
      customerId: subscription.customerId,
      active: subscription.active,
      status: subscription.status,
      planSlug: subscription.planSlug,
      currentCycleStartAt: subscription.currentCycleStartAt,
      currentCycleEndAt: subscription.currentCycleEndAt,
      project: {
        enabled: subscription.project.enabled,
      },
      customer: {
        active: subscription.customer.active,
      },
    }

    return result
  }

  private async getActiveSubscription(
    customerId: string,
    projectId: string,
    now: number,
    opts?: {
      skipCache: boolean
      skipDO: boolean
    }
  ): Promise<Result<SubcriptionCache | null, FetchError | UnPriceCustomerError>> {
    // swr handle cache stampede and other problems for us :)
    const { val, err } = opts?.skipCache
      ? await wrapResult(
          this.getActiveSubscriptionData({
            customerId,
            projectId,
            now,
          }),
          (err) =>
            new FetchError({
              message: "unable to query db",
              retry: false,
              context: {
                error: err.message,
                url: "",
                customerId: customerId,
                method: "",
              },
            })
        )
      : await retry(
          3,
          async () =>
            this.cache.customerSubscription.swr(customerId, () =>
              this.getActiveSubscriptionData({
                customerId,
                projectId,
                now,
              })
            ),
          (attempt, err) => {
            this.logger.warn("Failed to fetch subscription data, retrying...", {
              customerId: customerId,
              attempt,
              error: err.message,
            })
          }
        )

    if (err) {
      this.logger.error("error getting customer", {
        error: err.message,
      })

      return Err(
        new FetchError({
          message: err.message,
          retry: true,
          cause: err,
        })
      )
    }

    if (!val) {
      return Ok(null)
    }

    if (val.project.enabled === false) {
      return Err(
        new UnPriceCustomerError({
          code: "PROJECT_DISABLED",
          message: "project is disabled",
        })
      )
    }

    if (val.customer.active === false) {
      return Err(
        new UnPriceCustomerError({
          code: "CUSTOMER_DISABLED",
          message: "customer is disabled",
        })
      )
    }

    // take a look if the subscription is expired
    const bufferPeriod = 24 * 60 * 60 * 1000 // 1 day
    const validUntil = val.currentCycleEndAt + bufferPeriod
    const validFrom = val.currentCycleStartAt

    if (now < validFrom || now > validUntil) {
      return Err(
        new UnPriceCustomerError({ code: "SUBSCRIPTION_EXPIRED", message: "subscription expired" })
      )
    }

    return Ok(val)
  }

  private async getUsageFromAnalytics({
    customerId,
    projectId,
    featureSlug,
    startAt,
    endAt,
    aggregationMethod,
    isAccumulated = false,
  }: {
    customerId: string
    projectId: string
    featureSlug: string
    startAt: number
    endAt: number
    aggregationMethod: AggregationMethod
    isAccumulated?: boolean
  }) {
    // get the total usage and the usage for the current cycle
    const [totalAccumulatedUsage, totalUsage] = await Promise.all([
      isAccumulated
        ? this.analytics
            .getFeaturesUsageTotal({
              customerId,
              projectId,
              featureSlug,
            })
            .then((usage) => usage.data[0] ?? 0)
            .catch((error) => {
              // TODO: log this error
              console.error("error getting usage", error)

              return null
            })
        : null,
      this.analytics
        .getFeaturesUsagePeriod({
          customerId,
          projectId,
          featureSlug,
          start: startAt,
          end: endAt,
        })
        .then((usage) => usage.data[0] ?? 0)
        .catch((error) => {
          // TODO: log this error
          console.error("error getting usage", error)

          return null
        }),
    ])

    let usage = 0
    let accumulatedUsage = 0

    if (totalUsage) {
      usage = (totalUsage[aggregationMethod as keyof typeof totalUsage] as number) ?? 0
    }

    if (totalAccumulatedUsage) {
      accumulatedUsage =
        (totalAccumulatedUsage[
          aggregationMethod as keyof typeof totalAccumulatedUsage
        ] as number) ?? 0
    }

    return {
      usage,
      accumulatedUsage,
    }
  }

  private async getEntitlementData({
    customerId,
    featureSlug,
    projectId,
    now,
    opts,
  }: {
    customerId: string
    featureSlug: string
    projectId: string
    now: number
    opts?: {
      skipDO?: boolean
    }
  }): Promise<CustomerEntitlementCache | null> {
    if (opts?.skipDO) {
      // we data from the DO first, if not found then we query the db
      const { val: entitlementDO, err: entitlementDOErr } = await this.getActiveEntitlementFromDO(
        customerId,
        featureSlug
      )

      if (entitlementDOErr) {
        this.logger.error("error getting entitlement from DO", {
          error: entitlementDOErr.message,
        })
      }

      if (entitlementDO) {
        return entitlementDO
      }
    }

    // if not found in DO, then we query the db
    const entitlement = await this.db
      .select({
        customerEntitlement: customerEntitlements,
        featureType: planVersionFeatures.featureType,
        aggregationMethod: planVersionFeatures.aggregationMethod,
      })
      .from(customerEntitlements)
      .leftJoin(
        planVersionFeatures,
        eq(customerEntitlements.featurePlanVersionId, planVersionFeatures.id)
      )
      .leftJoin(features, eq(planVersionFeatures.featureId, features.id))
      .where(
        and(
          eq(features.slug, featureSlug),
          eq(customerEntitlements.customerId, customerId),
          eq(customerEntitlements.projectId, projectId),
          eq(customerEntitlements.active, true),
          lte(customerEntitlements.validFrom, now),
          gte(customerEntitlements.validTo, now)
        )
      )
      .then((e) => e[0])
      .catch((e) => {
        // TODO: log it
        console.error("error getting entitlement", e)
        return null
      })

    if (!entitlement || !entitlement.featureType || !entitlement.aggregationMethod) {
      return null
    }

    // get the usage from analytics
    const { usage, accumulatedUsage } = await this.getUsageFromAnalytics({
      customerId,
      projectId,
      featureSlug,
      startAt: entitlement.customerEntitlement.validFrom,
      endAt: now,
      aggregationMethod: entitlement.aggregationMethod,
      isAccumulated: entitlement.featureType.endsWith("_all"),
    })

    const result = {
      ...entitlement.customerEntitlement,
      featureType: entitlement.featureType,
      aggregationMethod: entitlement.aggregationMethod,
      usage: usage.toString(),
      accumulatedUsage: accumulatedUsage.toString(),
      featureSlug,
    }

    const durableObject = this.getStub(this.getDurableObjectCustomerId(customerId))
    // set the entitlement in the DO
    durableObject.setEntitlement(result)

    this.waitUntil(
      Promise.all([
        // set new usage and accumulated usage in background
        this.db
          .update(customerEntitlements)
          .set({
            usage: usage.toString(),
            accumulatedUsage: accumulatedUsage.toString(),
          })
          .where(
            and(
              eq(customerEntitlements.projectId, projectId),
              eq(customerEntitlements.id, entitlement.customerEntitlement.id),
              eq(customerEntitlements.customerId, customerId)
            )
          ),
      ])
    )

    return result
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

  private async getActiveEntitlement(
    customerId: string,
    featureSlug: string,
    projectId: string,
    now: number,
    opts?: {
      skipCache?: boolean // skip cache to force revalidation
      skipDO?: boolean // skip DO to force revalidation
    }
  ): Promise<Result<CustomerEntitlementCache | null, FetchError | UnPriceCustomerError>> {
    // first try to get the entitlement from cache, if not found try to get it from DO,
    // if not found try to get it from db
    // if found and expired, try to revalidate it
    // if expired then return the error
    const { val, err } = opts?.skipCache
      ? await wrapResult(
          this.getEntitlementData({
            customerId,
            featureSlug,
            projectId,
            now,
            opts: {
              skipDO: opts?.skipDO,
            },
          }),
          (err) =>
            new FetchError({
              message: "unable to query entitlement from db",
              retry: false,
              context: {
                error: err.message,
                url: "",
                customerId: customerId,
                method: "",
              },
            })
        )
      : await retry(
          3,
          async () =>
            this.cache.customerEntitlement.swr(`${customerId}:${featureSlug}`, () =>
              this.getEntitlementData({
                customerId,
                featureSlug,
                projectId,
                now,
              })
            ),
          (attempt, err) => {
            this.logger.warn("Failed to fetch entitlement data from cache, retrying...", {
              customerId: customerId,
              attempt,
              error: err.message,
            })
          }
        )

    if (err) {
      this.logger.error("error getting entitlement", {
        error: err.message,
      })

      return Err(
        new FetchError({
          message: err.message,
          retry: true,
          cause: err,
        })
      )
    }

    if (!val) {
      return Ok(null)
    }

    // entitlement could be expired since is in cache, validate it
    const bufferPeriod = val.bufferPeriodDays * 24 * 60 * 60 * 1000
    const validUntil = val.validTo + bufferPeriod
    const active = val.active

    if (now < val.validFrom || now > validUntil) {
      return Err(
        new UnPriceCustomerError({
          code: "ENTITLEMENT_EXPIRED",
          message: "entitlement expired",
        })
      )
    }

    if (active === false) {
      return Err(
        new UnPriceCustomerError({
          code: "ENTITLEMENT_NOT_ACTIVE",
          message: "entitlement is not active",
        })
      )
    }

    return Ok(val)
  }
  public async revalidateEntitlement(
    customerId: string,
    featureSlug: string,
    projectId: string
  ): Promise<{
    success: boolean
    message: string
  }> {
    const { err: subscriptionErr, val: subscription } = await this.getActiveSubscription(
      customerId,
      projectId,
      Date.now()
    )

    if (subscriptionErr) {
      return { success: false, message: subscriptionErr.message }
    }

    if (!subscription) {
      return { success: false, message: "customer has no active subscription" }
    }

    const { err: entitlementErr, val: entitlement } = await this.getActiveEntitlement(
      customerId,
      featureSlug,
      projectId,
      Date.now(),
      {
        skipCache: true,
        skipDO: true,
      }
    )

    if (entitlementErr) {
      return { success: false, message: entitlementErr.message }
    }

    if (!entitlement) {
      return { success: false, message: "entitlement not found" }
    }

    // set the entitlement in the DO
    const durableObject = this.getStub(this.getDurableObjectCustomerId(customerId))
    durableObject.setEntitlement(entitlement)

    return { success: true, message: "entitlement revalidated" }
  }

  public async deleteCustomer(
    customerId: string,
    projectId: string
  ): Promise<{
    success: boolean
    message: string
  }> {
    const { err: subscriptionErr, val: subscription } = await this.getActiveSubscription(
      customerId,
      projectId,
      Date.now()
    )

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

  public async can(data: CanRequest): Promise<{
    success: boolean
    message: string
    deniedReason?: DenyReason
  }> {
    const { err: subscriptionErr, val: subscription } = await this.getActiveSubscription(
      data.customerId,
      data.projectId,
      Date.now()
    )

    if (subscriptionErr) {
      return { success: false, message: subscriptionErr.message }
    }

    if (!subscription) {
      return { success: false, message: "customer has no active subscription" }
    }

    // Fast path: check if the limit is reached in the cache
    const { err: entitlementErr, val: entitlement } = await this.getActiveEntitlement(
      data.customerId,
      data.featureSlug,
      data.projectId,
      Date.now()
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

    return result
  }

  public async reportUsage(data: ReportUsageRequest): Promise<ReportUsageResponse> {
    try {
      // Good to know: DO is generally in the same region as the customer
      // customer can decide where to deploy the DO with locationHint
      // by default we let cloudflare decide the best location

      // this is not ideal but we need to validate the customer exists to avoid
      // reporting usage to a non existing customer or creating DOs for non existing customers
      const { err: subscriptionErr, val: subscription } = await this.getActiveSubscription(
        data.customerId,
        data.projectId,
        Date.now()
      )

      if (subscriptionErr) {
        return { success: false, message: subscriptionErr.message }
      }

      if (!subscription) {
        return { success: false, message: "customer has no active subscription" }
      }

      // in dev we use the idempotence key and timestamp to deduplicate reuse the same key for the same request
      const idempotentKey =
        env.NODE_ENV === "production"
          ? `${data.idempotenceKey}`
          : `${data.idempotenceKey}:${data.date}`

      // Fast path: check if the event has already been sent to the DO
      const { val: sent } = await this.cache.idempotentRequestUsageByHash.get(idempotentKey)

      // if the usage is already sent, return the result
      if (sent) {
        return sent
      }

      // Fast path: check if the limit is reached in the cache
      // Basically if the entitlement already hit it's limit we reject the request
      // We could allow report over usage later on
      const { err: entitlementErr, val: entitlement } = await this.getActiveEntitlement(
        data.customerId,
        data.featureSlug,
        data.projectId,
        Date.now()
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
        Promise.all([this.cache.idempotentRequestUsageByHash.set(idempotentKey, response)])
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
