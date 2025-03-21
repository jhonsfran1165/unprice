import type { Database } from "@unprice/db"
import type { FeatureType } from "@unprice/db/validators"
import { Err, FetchError, Ok, type Result } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import type { Cache } from "~/cache"
import type { Metrics } from "~/metrics/interface"
import type { DurableObjectUsagelimiter } from "./do.old"
import type {
  ReportUsageRequest,
  ReportUsageResponse,
  RevalidateRequest,
  UsageLimiter,
} from "./interface"
import { isValidEntitlement } from "./util"

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
    this.waitUntil = opts.waitUntil
    this.db = opts.db
  }

  private getStub(
    name: string,
    locationHint?: DurableObjectLocationHint
  ): DurableObjectStub<DurableObjectUsagelimiter> {
    return this.namespace.get(this.namespace.idFromName(name), {
      locationHint,
    })
  }

  private getDurableCustomerFeatureId(customerId: string, featureSlug: string): string {
    return `${customerId}:${featureSlug}`
  }

  private async getEntitlement(
    customerId: string,
    featureSlug: string,
    projectId: string
  ): Promise<
    Result<
      {
        usage: number
        accumulatedUsage: number
        validFrom: number
        validTo: number
        resetedAt: number
        limit: number
        featureType: FeatureType
      },
      FetchError
    >
  > {
    const { val, err } = await this.cache.customerEntitlementUsage.swr(
      `${customerId}:${featureSlug}`,
      async () => {
        // we revalidate against the durable object
        const durableObject = this.getStub(
          this.getDurableCustomerFeatureId(customerId, featureSlug)
        )
        const entitlement = await durableObject.getUsage(featureSlug)

        if (!entitlement) {
          return null
        }

        return {
          usage: entitlement.usage,
          accumulatedUsage: entitlement.accumulatedUsage,
          validFrom: entitlement.validFrom,
          validTo: entitlement.validTo,
          resetedAt: entitlement.resetedAt,
          limit: entitlement.limit,
          featureType: entitlement.featureType,
        }
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

    // cache miss, revalidate do
    if (!val) {
      const durableObject = this.getStub(this.getDurableCustomerFeatureId(customerId, featureSlug))
      await durableObject.revalidateEntitlement({
        customerId,
        projectId,
        featureSlug,
        now: Date.now(),
      })

      // get the entitlement again
      const entitlement = await durableObject.getUsage(featureSlug)

      if (!entitlement) {
        return Err(
          new FetchError({
            message: "entitlement not found",
            retry: false,
          })
        )
      }

      return Ok({
        usage: entitlement.usage,
        accumulatedUsage: entitlement.accumulatedUsage,
        validFrom: entitlement.validFrom,
        validTo: entitlement.validTo,
        resetedAt: entitlement.resetedAt,
        limit: entitlement.limit,
        featureType: entitlement.featureType,
      })
    }

    return Ok(val)
  }

  public async reportUsage(data: ReportUsageRequest): Promise<ReportUsageResponse> {
    try {
      // Good to know: DO is generally in the same region as the customer
      // customer can decide where to deploy the DO with locationHint
      // by default we let cloudflare decide the best location

      // Fast path: check if the limit is reached in the cache
      const { val: entitlement } = await this.getEntitlement(
        data.customerId,
        data.featureSlug,
        data.projectId
      )

      if (entitlement) {
        // check if the entitlement is expired
        // TODO: we have to revalidate the entitlement here
        if (entitlement.validTo < data.date) {
          return { valid: false, message: "entitlement expired" }
        }

        // validate entitlement dates
        if (!isValidEntitlement(entitlement, data.date)) {
          return { valid: false, message: "entitlement dates are invalid, please contact support." }
        }

        // if feature type is flat, we don't need to call the DO
        if (entitlement.featureType === "flat") {
          return {
            valid: true,
            message:
              "feature is flat, limit is not applicable but events are billed. Please don't report usage for flat features to avoid overbilling.",
          }
        }

        // it's a valid entitlement
        // check if the usage is over the limit
        if (entitlement.usage + data.usage > entitlement.limit) {
          return { valid: false, message: "usage over the limit" }
        }
      }

      // Fast path: check if the event is already sent to the DO
      const { val: sent } = await this.cache.idempotentRequestUsageByHash.get(data.idempotenceKey)

      // if the usage is already sent, return the result
      if (sent) {
        return sent
      }

      // Report usage path: send the usage to the DO
      const d = this.getStub(this.getDurableCustomerFeatureId(data.customerId, data.featureSlug))
      const result = await d.reportUsage(data)

      // cache the result for the next time
      await this.cache.idempotentRequestUsageByHash.set(data.idempotenceKey, result)

      // cache the entitlement for the next time
      await this.cache.customerEntitlementUsage.set(
        this.getDurableCustomerFeatureId(data.customerId, data.featureSlug),
        {
          usage: result.usage,
          accumulatedUsage: result.accumulatedUsage,
          validFrom: result.validFrom,
          validTo: result.validTo,
          resetedAt: result.resetedAt,
          limit: result.limit,
          featureType: result.featureType,
        }
      )

      return result

      // const threshold = 80 // notify when the usage is 80% or more
      // const currentUsage = entitlement.usage ?? 0
      // const limit = entitlement.limit
      // let message = ""
      // let notifyUsage = false

      // // check flat features
      // if (entitlement.featureType === "flat") {
      //   return { valid: true }
      // }

      // // check limit
      // if (limit) {
      //   const usagePercentage = (currentUsage / limit) * 100

      //   if (currentUsage >= limit) {
      //     // Usage has reached or exceeded the limit
      //     message = `Your feature ${entitlement.featureSlug} has reached or exceeded its usage limit of ${limit}. Current usage: ${usagePercentage.toFixed(
      //       2
      //     )}% of its usage limit. This is over the limit by ${currentUsage - limit}`
      //     notifyUsage = true
      //   } else if (usagePercentage >= threshold) {
      //     // Usage is at or above the threshold
      //     message = `Your feature ${entitlement.featureSlug} is at ${usagePercentage.toFixed(
      //       2
      //     )}% of its usage limit`
      //     notifyUsage = true
      //   }
      // }
    } catch (e) {
      console.error("usagelimit failed", {
        customerId: data.customerId,
        error: (e as Error).message,
      })
      return { valid: false }
    } finally {
    }
  }

  public async revalidate(req: RevalidateRequest): Promise<void> {
    const obj = this.namespace.get(this.namespace.idFromName(req.customerId))
    await obj.revalidate()
  }
}
