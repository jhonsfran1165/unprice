import { env } from "cloudflare:workers"
import type { Analytics } from "@unprice/analytics"
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
import type { Cache, CustomerEntitlementCache, SubcriptionCache } from "@unprice/services/cache"
import type { CustomerService, DenyReason } from "@unprice/services/customers"
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

  // TODO: add in memory cache for overused entitlements
  // https://github.com/unkeyed/unkey/blob/main/apps/api/src/pkg/ratelimit/do_client.ts#L31

  constructor(opts: {
    namespace: DurableObjectNamespace<DurableObjectUsagelimiter>
    projectNamespace: DurableObjectNamespace<DurableObjectProject>
    requestId: string
    domain?: string
    logger: Logger
    metrics: Metrics
    analytics: Analytics
    cache: Cache
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    waitUntil: (promise: Promise<any>) => void
    db: Database
    customer: CustomerService
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
      units: entitlement.units,
      metadata: entitlement.metadata ? JSON.parse(entitlement.metadata) : null,
    })
  }

  private async getEntitlementsFromDO(
    customerId: string
  ): Promise<Result<CustomerEntitlementCache[] | null, FetchError | UnPriceCustomerError>> {
    const durableObject = this.getStub(this.getDurableObjectCustomerId(customerId))
    const entitlements = await durableObject.getEntitlements()

    if (!entitlements) {
      return Ok(null)
    }

    return Ok(
      entitlements.map((entitlement) => ({
        ...entitlement,
        id: entitlement.entitlementId,
        active: entitlement.active === 1,
        realtime: entitlement.realtime === 1,
        isCustom: entitlement.isCustom === 1,
        metadata: entitlement.metadata ? JSON.parse(entitlement.metadata) : null,
      }))
    )
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
  ): Promise<Result<SubcriptionCache, FetchError | UnPriceCustomerError>> {
    const { err: subscriptionErr, val: subscription } =
      await this.customerService.getActiveSubscription(customerId, projectId, {
        skipCache: false,
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

  // broadcast the event to the project
  private async broadcastEvent(
    projectId: string,
    event: {
      customerId: string
      featureSlug: string
      type: "can" | "reportUsage"
      success: boolean
      deniedReason?: DenyReason
      usage?: number
      limit?: number
      notifyUsage?: boolean
    }
  ) {
    const projectDurableObject = this.projectNamespace.get(
      this.projectNamespace.idFromName(projectId)
    )
    projectDurableObject.broadcastEvents(event)
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

    // after this point we can report the verification event
    const durableObject = this.getStub(this.getDurableObjectCustomerId(data.customerId))

    const result = await durableObject.can(data)

    if (result.deniedReason === "ENTITLEMENT_NOT_FOUND") {
      // revalidate the entitlement
      const { err: revalidateErr } = await this.revalidateEntitlement(
        data.customerId,
        data.featureSlug,
        data.projectId,
        data.timestamp // active entitlement actual timestamp
      )

      if (revalidateErr) {
        return {
          success: false,
          message: revalidateErr.message,
          deniedReason: "ENTITLEMENT_NOT_FOUND",
        }
      }

      // broadcast the event to the project with waitUntil
      this.waitUntil(
        this.broadcastEvent(data.projectId, {
          customerId: data.customerId,
          featureSlug: data.featureSlug,
          type: "can",
          success: result.success,
          deniedReason: result.deniedReason,
        })
      )

      // try again
      return await durableObject.can(data)
    }

    // broadcast the event to the project with waitUntil
    this.waitUntil(
      this.broadcastEvent(data.projectId, {
        customerId: data.customerId,
        featureSlug: data.featureSlug,
        type: "can",
        success: result.success,
        deniedReason: result.deniedReason,
      })
    )

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
          : `${data.idempotenceKey}:${data.timestamp}`

      // Fast path: check if the event has already been sent to the DO
      const { val: sent } = await this.cache.idempotentRequestUsageByHash.get(idempotentKey)

      // if the usage is already sent, return the result
      if (sent) {
        return sent
      }

      const durableObject = this.getStub(this.getDurableObjectCustomerId(data.customerId))
      const result = await durableObject.reportUsage(data)

      if (result.message === "ENTITLEMENT_NOT_FOUND") {
        // revalidate the entitlement
        const { err: revalidateErr } = await this.revalidateEntitlement(
          data.customerId,
          data.featureSlug,
          data.projectId,
          data.timestamp // active entitlement actual timestamp
        )

        if (revalidateErr) {
          return { success: false, message: revalidateErr.message }
        }

        // try again
        const result = await durableObject.reportUsage(data)

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
            this.broadcastEvent(data.projectId, {
              customerId: data.customerId,
              featureSlug: data.featureSlug,
              type: "reportUsage",
              success: result.success,
              usage: Number(data.usage),
              limit: Number(result.limit),
              notifyUsage: result.notifyUsage,
            }),
          ])
        )

        return response
      }

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
          this.broadcastEvent(data.projectId, {
            customerId: data.customerId,
            featureSlug: data.featureSlug,
            type: "reportUsage",
            success: result.success,
            usage: Number(result.usage),
            limit: Number(result.limit),
            notifyUsage: result.notifyUsage,
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

    // get the entitlements from the DO
    const { val: entitlementsDO } = await this.getEntitlementsFromDO(customerId)

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
    const { val: entitlementsDO } = await this.getEntitlementsFromDO(customerId)

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
      trialDays: phase.trialDays,
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
