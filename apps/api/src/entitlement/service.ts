import { env } from "cloudflare:workers"
import type { Analytics } from "@unprice/analytics"
import type { Stats } from "@unprice/analytics/utils"
import type { Database } from "@unprice/db"
import {
  calculateFlatPricePlan,
  calculateFreeUnits,
  calculatePricePerFeature,
  calculateTotalPricePlan,
  configureBillingCycleSubscription,
} from "@unprice/db/validators"
import { Err, type FetchError, Ok, type Result } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Cache, SubcriptionCache } from "@unprice/services/cache"
import type { CustomerService } from "@unprice/services/customers"
import { UnPriceCustomerError } from "@unprice/services/customers"
import type { Metrics } from "@unprice/services/metrics"
import type { DurableObjectProject } from "~/project/do"
import type { DurableObjectUsagelimiter } from "./do"
import type {
  CanRequest,
  CanResponse,
  GetEntitlementsRequest,
  GetEntitlementsResponse,
  GetUsageRequest,
  GetUsageResponse,
  ReportUsageRequest,
  ReportUsageResponse,
} from "./interface"

export class EntitlementService {
  private readonly namespace: DurableObjectNamespace<DurableObjectUsagelimiter>
  private readonly projectNamespace: DurableObjectNamespace<DurableObjectProject>
  private readonly logger: Logger
  private readonly metrics: Metrics
  private readonly analytics: Analytics
  private readonly cache: Cache
  private readonly db: Database
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private readonly waitUntil: (promise: Promise<any>) => void
  private readonly customerService: CustomerService
  private readonly stats: Stats
  private readonly requestId: string
  private hashCache: Map<string, string>

  constructor(opts: {
    namespace: DurableObjectNamespace<DurableObjectUsagelimiter>
    projectNamespace: DurableObjectNamespace<DurableObjectProject>
    requestId: string
    domain?: string
    logger: Logger
    metrics: Metrics
    analytics: Analytics
    hashCache: Map<string, string>
    cache: Cache
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    waitUntil: (promise: Promise<any>) => void
    db: Database
    customer: CustomerService
    stats: Stats
  }) {
    this.namespace = opts.namespace
    this.logger = opts.logger
    this.metrics = opts.metrics
    this.analytics = opts.analytics
    this.cache = opts.cache
    this.db = opts.db
    this.waitUntil = opts.waitUntil
    this.customerService = opts.customer
    this.projectNamespace = opts.projectNamespace
    this.stats = opts.stats
    this.requestId = opts.requestId
    this.hashCache = opts.hashCache
  }

  // for EU countries we have to keep the stub in the EU namespace
  private getStub(
    name: string,
    locationHint?: DurableObjectLocationHint
  ): DurableObjectStub<DurableObjectUsagelimiter> {
    // jurisdiction is only available in production
    if (this.stats.isEUCountry && env.NODE_ENV === "production") {
      const euSubnamespace = this.namespace.jurisdiction("eu")
      const euStub = euSubnamespace.get(euSubnamespace.idFromName(name), {
        locationHint,
      })

      return euStub
    }

    return this.namespace.get(this.namespace.idFromName(name), {
      locationHint,
    })
  }

  private getDurableObjectCustomerId(customerId: string): string {
    // later on we can shard this by customer and feature slug if needed
    return `${customerId}`
  }

  /*
   * This is used to validate the subscription of the customer
   * It's used to check if the customer has an active subscription
   * @param customerId - The id of the customer
   * @param projectId - The id of the project
   * @returns The subscription of the customer
   */
  private async validateSubscription(
    customerId: string,
    projectId: string,
    opts?: {
      skipCache?: boolean
    }
  ): Promise<Result<SubcriptionCache, FetchError | UnPriceCustomerError>> {
    const { err: subscriptionErr, val: subscription } =
      await this.customerService.getActiveSubscription(customerId, projectId, {
        skipCache: opts?.skipCache ?? false,
      })

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
    slugs?: string[]
  }> {
    // get last subscription details before resetting the DO
    const { err: subscriptionErr } = await this.validateSubscription(customerId, projectId, {
      skipCache: true,
    })

    if (subscriptionErr) {
      return { success: false, message: subscriptionErr.message, slugs: [] }
    }

    const durableObject = this.getStub(this.getDurableObjectCustomerId(customerId))
    const result = await durableObject.resetDO()

    if (!result.success) {
      return { success: false, message: result.message, slugs: result.slugs ?? [] }
    }

    // cache keys to remove
    const keys = result.slugs?.map((slug) => `${projectId}:${customerId}:${slug}`)

    // delete the cache
    this.waitUntil(
      Promise.all([
        this.cache.customerEntitlement.remove(keys ?? []),
        this.cache.customerSubscription.remove(`${projectId}:${customerId}`),
      ])
    )

    return {
      success: true,
      message: "customer DO deleted",
      slugs: result.slugs ?? [],
    }
  }

  private getHashKey(data: CanRequest): string {
    return `${data.customerId}:${data.featureSlug}:${data.projectId}`
  }

  public async can(data: CanRequest): Promise<CanResponse> {
    const key = this.getHashKey(data)
    const cached = this.hashCache.get(key)

    // if we hit the same isolate we can return the cached result
    // only for request that are denied.
    // we don't use the normal swr cache here because it doesn't make sense to call
    // the cache layer, the idea is to speed up the next request
    if (cached && env.NODE_ENV === "production") {
      const result = JSON.parse(cached) as CanResponse

      // TODO: we could still send the verification event to the DO
      return { ...result, cacheHit: true }
    }

    // after this point we can report the verification event
    const durableObject = this.getStub(this.getDurableObjectCustomerId(data.customerId))

    // this is the most expensive call in terms of latency
    const result = await durableObject.can(data)

    // in extreme cases we hit in memory cache for the same isolate, speeding up the next request
    if (!result.success && result.deniedReason) {
      this.hashCache.set(this.getHashKey(data), JSON.stringify(result))
    }

    return result
  }

  public async reportUsage(data: ReportUsageRequest): Promise<ReportUsageResponse> {
    // in dev we use the idempotence key and timestamp to deduplicate reuse the same key for the same request
    const idempotentKey =
      env.NODE_ENV === "production"
        ? `${data.idempotenceKey}`
        : `${data.idempotenceKey}:${data.timestamp}`

    const cacheKey = `${data.customerId}:${data.featureSlug}:${data.projectId}:${idempotentKey}`
    // Fast path: check if the event has already been sent to the DO
    const { val: sent } = await this.cache.idempotentRequestUsageByHash.get(cacheKey)

    // if the usage is already sent, return the result
    if (sent) {
      return { ...sent, cacheHit: true }
    }

    const durableObject = this.getStub(this.getDurableObjectCustomerId(data.customerId))
    const result = await durableObject.reportUsage(data).then((result) => {
      return {
        success: result.success,
        message: result.message,
        limit: Number(result.limit),
        usage: Number(result.usage),
        notifyUsage: result.notifyUsage,
        deniedReason: result.deniedReason,
      }
    })

    this.waitUntil(
      // cache the result for the next time
      // update the cache with the new usage so we can check limit in the next request
      // without calling the DO again
      Promise.all([this.cache.idempotentRequestUsageByHash.set(cacheKey, result)])
    )

    return result
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

    if (!entitlements || entitlements.length === 0) {
      throw new UnPriceCustomerError({
        code: "CUSTOMER_ENTITLEMENTS_NOT_FOUND",
        message: "customer has no entitlements",
      })
    }

    // get the entitlements from the DO
    const durableObject = this.getStub(this.getDurableObjectCustomerId(customerId))
    const entitlementsDO = await durableObject.getEntitlements()

    if (entitlementsDO) {
      // set the usage from the DO to the entitlements
      entitlements.forEach((entitlement) => {
        const entitlementDO = entitlementsDO.find((e) => e.featureSlug === entitlement.featureSlug)
        if (entitlementDO) {
          entitlement.usage = entitlementDO.usage
        }
      })
    }

    return {
      entitlements,
    }
  }

  public async getUsage(req: GetUsageRequest): Promise<GetUsageResponse> {
    const { customerId, projectId, now } = req

    const { err: subscriptionErr, val: subscription } = await this.validateSubscription(
      customerId,
      projectId
    )

    if (subscriptionErr) {
      throw subscriptionErr
    }

    const { err: phaseErr, val: phase } = await this.customerService.getActivePhase({
      customerId,
      projectId,
      now,
    })

    if (phaseErr) {
      throw phaseErr
    }

    if (!phase) {
      throw new UnPriceCustomerError({
        code: "CUSTOMER_PHASE_NOT_FOUND",
        message: "customer has no active phase",
      })
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

    if (!entitlements || entitlements.length === 0) {
      throw new UnPriceCustomerError({
        code: "CUSTOMER_ENTITLEMENTS_NOT_FOUND",
        message: "customer has no entitlements",
      })
    }

    // get the entitlements from the DO
    const durableObject = this.getStub(this.getDurableObjectCustomerId(customerId))
    const entitlementsDO = await durableObject.getEntitlements()

    if (entitlementsDO) {
      // set the usage from the DO to the entitlements
      entitlements.forEach((entitlement) => {
        const entitlementDO = entitlementsDO.find((e) => e.featureSlug === entitlement.featureSlug)
        if (entitlementDO) {
          entitlement.usage = entitlementDO.usage
        }
      })
    }

    const quantities = entitlements.reduce(
      (acc, entitlement) => {
        acc[entitlement.featurePlanVersionId] =
          entitlement.featureType === "usage"
            ? Number(entitlement.usage)
            : Number(entitlement.units)
        return acc
      },
      {} as Record<string, number>
    )

    const calculatedBillingCycle = configureBillingCycleSubscription({
      currentCycleStartAt: subscription.currentCycleStartAt,
      billingConfig: phase.planVersion.billingConfig,
      trialUnits: phase.trialDays,
      alignStartToDay: true,
      alignEndToDay: true,
      endAt: phase.endAt ?? undefined,
      alignToCalendar: true,
    })

    const { val: totalPricePlan, err: totalPricePlanErr } = calculateTotalPricePlan({
      features: phase.customerEntitlements.map((e) => e.featurePlanVersion),
      quantities: quantities,
      prorate: calculatedBillingCycle.prorationFactor,
      currency: phase.planVersion.currency,
    })

    const { err: flatPriceErr, val: flatPrice } = calculateFlatPricePlan({
      planVersion: {
        ...phase.planVersion,
        // TODO: improve this
        planFeatures: phase.customerEntitlements.map((e) => e.featurePlanVersion),
      },
      prorate: 1,
    })

    if (totalPricePlanErr || flatPriceErr) {
      throw totalPricePlanErr || flatPriceErr
    }

    // TODO: save this to cache
    const result = {
      planVersion: {
        description: phase.planVersion.description,
        flatPrice: flatPrice.displayAmount,
        currentTotalPrice: totalPricePlan.displayAmount,
        billingConfig: phase.planVersion.billingConfig,
      },
      subscription: {
        planSlug: subscription.planSlug,
        status: subscription.status,
        currentCycleEndAt: subscription.currentCycleEndAt,
        timezone: subscription.timezone,
        currentCycleStartAt: subscription.currentCycleStartAt,
        prorationFactor: calculatedBillingCycle.prorationFactor,
        prorated: calculatedBillingCycle.prorationFactor !== 1,
      },
      phase: {
        trialEndsAt: phase.trialEndsAt,
        endAt: phase.endAt,
        trialDays: phase.trialDays,
        isTrial: phase.trialEndsAt ? Date.now() < phase.trialEndsAt : false,
      },
      entitlement: entitlements.map((e) => {
        const entitlementPhase = phase.customerEntitlements.find((p) => e.id === p.id)

        // if the entitlement is not found in the phase, it means it's a custom entitlement
        // no need to add price information
        if (!entitlementPhase) {
          const featureVersion = phase.customerEntitlements.find(
            (p) => p.featurePlanVersionId === e.featurePlanVersionId
          )
          return {
            featureSlug: e.featureSlug,
            featureType: e.featureType,
            isCustom: true,
            limit: e.limit,
            usage: Number(e.usage),
            units: e.units,
            freeUnits: 0,
            max: e.limit || Number.POSITIVE_INFINITY,
            included: 0,
            featureVersion: featureVersion?.featurePlanVersion!,
            price: null,
          }
        }

        const { config, featureType } = entitlementPhase.featurePlanVersion
        const freeUnits = calculateFreeUnits({ config: config!, featureType: featureType })
        const { val: price } = calculatePricePerFeature({
          config: config!,
          featureType: featureType,
          quantity: quantities[entitlementPhase.featurePlanVersionId] ?? 0,
          prorate: calculatedBillingCycle.prorationFactor,
        })

        return {
          featureSlug: e.featureSlug,
          featureType: e.featureType,
          limit: e.limit,
          usage: Number(e.usage),
          units: e.units,
          isCustom: false,
          freeUnits,
          included:
            freeUnits === Number.POSITIVE_INFINITY
              ? e.limit || Number.POSITIVE_INFINITY
              : freeUnits,
          price: price?.totalPrice.displayAmount ?? "0",
          max: e.limit || Number.POSITIVE_INFINITY,
          featureVersion: entitlementPhase.featurePlanVersion,
        }
      }),
    }

    return result
  }
}
