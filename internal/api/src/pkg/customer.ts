import type { Database } from "@unprice/db"

import type { FeatureType } from "@unprice/db/validators"
import { FetchError, type Result } from "@unprice/error"
import { Err, Ok } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import { getCustomerFeatureQuery, getEntitlementsQuery } from "../queries"
import type { Context } from "../trpc"
import type { Cache } from "./cache"
import type { CacheNamespaces, SubscriptionItemCached } from "./cache/namespaces"
import type { DenyReason } from "./errors"
import { UnPriceCustomerError } from "./errors"
import type { Metrics } from "./metrics"

export class UnpriceCustomer {
  private readonly cache: Cache
  private readonly db: Database
  private readonly metrics: Metrics
  private readonly logger: Logger
  private readonly waitUntil: (p: Promise<unknown>) => void
  private readonly analytics: Analytics

  constructor(opts: {
    cache: Cache
    metrics: Metrics
    db: Database
    analytics: Analytics
    logger: Logger
    waitUntil: (p: Promise<unknown>) => void
  }) {
    this.cache = opts.cache
    this.db = opts.db
    this.metrics = opts.metrics
    this.analytics = opts.analytics
    this.logger = opts.logger
    this.waitUntil = opts.waitUntil
  }

  private async _getCustomerFeature(opts: {
    customerId: string
    projectId: string
    featureSlug: string
    month: number
    year: number
  }): Promise<Result<SubscriptionItemCached, UnPriceCustomerError | FetchError>> {
    const res = await this.cache.featureByCustomerId.swr(
      `${opts.customerId}:${opts.featureSlug}:${opts.year}:${opts.month}`,
      async () => {
        return await getCustomerFeatureQuery({
          projectId: opts.projectId,
          featureSlug: opts.featureSlug,
          customerId: opts.customerId,
          metrics: this.metrics,
          logger: this.logger,
          analytics: this.analytics,
          month: opts.month,
          year: opts.year,
        })
      }
    )

    if (res.err) {
      this.logger.error(`Error in _getCustomerFeature: ${res.err.message}`, {
        error: JSON.stringify(res.err),
        customerId: opts.customerId,
        featureSlug: opts.featureSlug,
        projectId: opts.projectId,
      })

      return Err(
        new FetchError({
          message: "unable to fetch required data",
          retry: true,
          cause: res.err,
        })
      )
    }

    // cache miss, get from db
    if (!res.val) {
      const feature = await getCustomerFeatureQuery({
        projectId: opts.projectId,
        featureSlug: opts.featureSlug,
        customerId: opts.customerId,
        metrics: this.metrics,
        logger: this.logger,
        analytics: this.analytics,
        month: opts.month,
        year: opts.year,
      })

      if (!feature) {
        return Err(
          new UnPriceCustomerError({
            code: "FEATURE_OR_CUSTOMER_NOT_FOUND",
            customerId: opts.customerId,
          })
        )
      }

      // save the data in the cache
      this.waitUntil(
        this.cache.featureByCustomerId.set(
          `${opts.customerId}:${opts.featureSlug}:${opts.year}:${opts.month}`,
          feature
        )
      )

      return Ok(feature)
    }

    return Ok(res.val)
  }

  public async getEntitlements(opts: {
    customerId: string
    projectId: string
  }): Promise<
    Result<CacheNamespaces["entitlementsByCustomerId"], UnPriceCustomerError | FetchError>
  > {
    const res = await this.cache.entitlementsByCustomerId.swr(opts.customerId, async () => {
      return await getEntitlementsQuery({
        customerId: opts.customerId,
        projectId: opts.projectId,
        db: this.db,
        metrics: this.metrics,
        logger: this.logger,
      })
    })

    if (res.err) {
      this.logger.error("unable to fetch entitlements", {
        error: JSON.stringify(res.err),
        customerId: opts.customerId,
        projectId: opts.projectId,
      })

      return Err(
        new FetchError({
          message: "unable to fetch required data",
          retry: true,
          cause: res.err,
        })
      )
    }

    if (res.val) {
      return Ok(res.val)
    }

    // cache miss, get from db
    const entitlements = await getEntitlementsQuery({
      customerId: opts.customerId,
      projectId: opts.projectId,
      db: this.db,
      metrics: this.metrics,
      logger: this.logger,
    })

    // cache the active entitlements
    this.waitUntil(this.cache.entitlementsByCustomerId.set(opts.customerId, entitlements))

    return Ok(entitlements)
  }

  public async verifyFeature(opts: {
    customerId: string
    featureSlug: string
    projectId: string
    month: number
    year: number
    ctx: Context
  }): Promise<
    Result<
      {
        access: boolean
        currentUsage?: number
        limit?: number
        deniedReason?: DenyReason
        remaining?: number
        featureType?: FeatureType
      },
      UnPriceCustomerError | FetchError
    >
  > {
    try {
      const { customerId, projectId, featureSlug, month, year } = opts
      const start = performance.now()

      const res = await this._getCustomerFeature({
        customerId,
        projectId,
        featureSlug,
        month,
        year,
      })

      if (res.err) {
        const error = res.err

        this.logger.error("Error in verifyFeature", {
          error: JSON.stringify(error),
          customerId: opts.customerId,
          featureSlug: opts.featureSlug,
          projectId: opts.projectId,
        })

        switch (true) {
          case error instanceof UnPriceCustomerError: {
            // we should return a response with the denied reason in this case
            if (error.code === "FEATURE_NOT_FOUND_IN_SUBSCRIPTION") {
              return Ok({
                access: false,
                deniedReason: "FEATURE_NOT_FOUND_IN_SUBSCRIPTION",
              })
            }

            return res
          }

          default:
            return res
        }
      }

      const subItem = res.val

      if (!subItem) {
        return Ok({
          access: false,
          deniedReason: "FEATURE_NOT_FOUND_IN_SUBSCRIPTION",
        })
      }

      const analyticsPayload = {
        projectId: subItem.projectId,
        planVersionFeatureId: subItem.featurePlanVersionId,
        subscriptionId: subItem.subscriptionId,
        subItemId: subItem.id,
        featureSlug: featureSlug,
        customerId: customerId,
        time: Date.now(),
      }

      switch (subItem.featureType) {
        case "flat": {
          // flat feature are like feature flags
          break
        }
        // the rest of the features need to check the usage
        case "usage":
        case "tier":
        case "package": {
          const currentUsage = subItem.currentUsage
          const limit = subItem.limit
          const units = subItem.units
          // remaining usage given the units the user bought
          const remainingUsage = units ? units - currentUsage : undefined
          const remainingToLimit = limit ? limit - currentUsage : undefined

          // check usage
          if (remainingUsage && remainingUsage <= 0) {
            this.waitUntil(
              this.analytics.ingestFeaturesVerification({
                ...analyticsPayload,
                latency: performance.now() - start,
                deniedReason: "USAGE_EXCEEDED",
              })
            )

            return Ok({
              currentUsage: currentUsage,
              limit: limit ?? undefined,
              featureType: subItem.featureType,
              access: false,
              deniedReason: "USAGE_EXCEEDED",
              remaining: remainingUsage,
            })
          }

          // check limits
          if (remainingToLimit && remainingToLimit <= 0) {
            this.waitUntil(
              this.analytics.ingestFeaturesVerification({
                ...analyticsPayload,
                latency: performance.now() - start,
                deniedReason: "LIMIT_EXCEEDED",
              })
            )

            return Ok({
              currentUsage: currentUsage,
              limit: limit ?? undefined,
              featureType: subItem.featureType,
              access: false,
              deniedReason: "LIMIT_EXCEEDED",
              remaining: remainingToLimit,
            })
          }

          break
        }

        default:
          this.logger.error("Unhandled feature type", {
            featureType: subItem.featureType,
          })
          break
      }

      this.waitUntil(
        this.analytics
          .ingestFeaturesVerification({
            ...analyticsPayload,
            latency: performance.now() - start,
          })
          .catch((error) =>
            this.logger.error("Error reporting usage to analytics verifyFeature", {
              error: JSON.stringify(error),
              analyticsPayload,
            })
          )
      )

      return Ok({
        featureType: subItem.featureType,
        access: true,
      })
    } catch (e) {
      const error = e as Error
      this.logger.error("Unhandled error while verifying feature", {
        error: JSON.stringify(error),
        customerId: opts.customerId,
        featureSlug: opts.featureSlug,
        projectId: opts.projectId,
      })

      return Err(
        new UnPriceCustomerError({
          code: "UNHANDLED_ERROR",
          customerId: opts.customerId,
        })
      )
    }
  }

  public async reportUsage(opts: {
    customerId: string
    featureSlug: string
    projectId: string
    month: number
    year: number
    usage: number
  }): Promise<Result<{ success: boolean; message?: string }, UnPriceCustomerError | FetchError>> {
    try {
      const { customerId, featureSlug, projectId, usage, month, year } = opts

      // get the item details from the cache or the db
      const res = await this._getCustomerFeature({
        customerId,
        projectId,
        featureSlug,
        month,
        year,
      })

      if (res.err) {
        return res
      }

      const subItem = res.val

      // TODO: should I report the usage even if the limit was exceeded?
      // for now let the customer report more usage than the limit but add notifications
      const threshold = 80 // notify when the usage is 80% or more
      const currentUsage = subItem.currentUsage
      const limit = subItem.limit
      const units = subItem.units
      let message = ""
      let notifyUsage = false

      // check usage
      if (units) {
        const unitsPercentage = (currentUsage / units) * 100

        if (currentUsage >= units) {
          message = `Your feature ${featureSlug} has reached or exceeded its usage of ${units}. Current usage: ${unitsPercentage.toFixed(
            2
          )}% of its units usage. This is over the units by ${currentUsage - units}`
          notifyUsage = true
        } else if (unitsPercentage >= threshold) {
          message = `Your feature ${featureSlug} is at ${unitsPercentage.toFixed(
            2
          )}% of its units usage`
          notifyUsage = true
        }
      }

      // check limit
      if (limit) {
        const usagePercentage = (currentUsage / limit) * 100

        if (currentUsage >= limit) {
          // Usage has reached or exceeded the limit
          message = `Your feature ${featureSlug} has reached or exceeded its usage limit of ${limit}. Current usage: ${usagePercentage.toFixed(
            2
          )}% of its usage limit. This is over the limit by ${currentUsage - limit}`
          notifyUsage = true
        } else if (usagePercentage >= threshold) {
          // Usage is at or above the threshold
          message = `Your feature ${featureSlug} is at ${usagePercentage.toFixed(
            2
          )}% of its usage limit`
          notifyUsage = true
        }
      }

      // flat features don't have usage
      if (subItem.featureType === "flat") {
        return Ok({
          success: true,
        })
      }

      this.waitUntil(
        Promise.all([
          // notify usage
          // TODO: add notification to email, slack?
          notifyUsage && Promise.resolve(),
          // report the usage to analytics db
          this.analytics
            .ingestFeaturesUsage({
              planVersionFeatureId: subItem.featurePlanVersionId,
              subscriptionId: subItem.subscriptionId,
              projectId: subItem.projectId,
              usage: usage,
              time: Date.now(),
              month: month,
              year: year,
              subItemId: subItem.id,
              featureSlug: featureSlug,
              customerId: customerId,
            })
            .then(() => {
              // TODO: Only available in pro plus plan
              // TODO: usage is not always sum to the current usage, could be counter, etc
              // also if there are many request per second, we could debounce the update somehow
              if (subItem.realtime) {
                this.cache.featureByCustomerId.set(
                  `${customerId}:${featureSlug}:${year}:${month}`,
                  {
                    ...subItem,
                    currentUsage: subItem.currentUsage + usage,
                    lastUpdatedAt: Date.now(),
                  }
                )
              }
            })
            .catch((error) => {
              this.logger.error("Error reporting usage to analytics ingestFeaturesUsage", {
                error: JSON.stringify(error),
                subItem: subItem,
                usage: usage,
              })
            }),
        ])
      )

      return Ok({
        success: true,
        message,
      })
    } catch (e) {
      const error = e as Error
      this.logger.error("Unhandled error while reporting usage", {
        error: JSON.stringify(error),
        customerId: opts.customerId,
        featureSlug: opts.featureSlug,
        projectId: opts.projectId,
      })

      throw e
    }
  }
}
