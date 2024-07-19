import type { Database } from "@unprice/db"

import type { FeatureType } from "@unprice/db/validators"
import { FetchError, type Result } from "@unprice/error"
import { Err, Ok } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import { getCustomerFeatureQuery, getEntitlementsQuery, reportUsageQuery } from "../queries"
import type { Context } from "../trpc"
import type { Cache } from "./cache"
import type {
  CacheNamespaces,
  CurrentUsageCached,
  SubscriptionItemCached,
} from "./cache/namespaces"
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
  }): Promise<Result<SubscriptionItemCached, UnPriceCustomerError | FetchError>> {
    const res = await this.cache.featureByCustomerId.swr(
      `${opts.customerId}:${opts.featureSlug}`,
      async () => {
        return await getCustomerFeatureQuery({
          projectId: opts.projectId,
          featureSlug: opts.featureSlug,
          customerId: opts.customerId,
          metrics: this.metrics,
          logger: this.logger,
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
      })

      if (!feature) {
        return Err(
          new UnPriceCustomerError({
            code: "FEATURE_NOT_FOUND_IN_SUBSCRIPTION",
            customerId: opts.customerId,
          })
        )
      }

      // save the data in the cache
      this.waitUntil(
        this.cache.featureByCustomerId.set(`${opts.customerId}:${opts.featureSlug}`, feature)
      )

      return Ok(feature)
    }

    return Ok(res.val)
  }

  private async _getCustomerUsageFeature(opts: {
    subItem: SubscriptionItemCached
    customerId: string
    projectId: string
    featureSlug: string
    year: number
    month: number
  }): Promise<Result<CurrentUsageCached, UnPriceCustomerError | FetchError>> {
    const res = await this.cache.customerFeatureCurrentUsage.swr(
      `${opts.customerId}:${opts.featureSlug}:${opts.year}:${opts.month}`,
      async () => {
        const usageData = await this.analytics
          .getUsageFeature({
            customerId: opts.customerId,
            featureSlug: opts.featureSlug,
            projectId: opts.projectId,
            start: new Date(opts.year, opts.month, 1).getTime(),
            end: new Date(opts.year, opts.month + 1).getTime(),
          })
          .then((usage) => usage.data[0])

        // this will be the usage of the feature for the period
        const data = usageData ? usageData[opts.subItem.aggregationMethod] || 0 : 0

        const usage = {
          usage: data,
          limit: opts.subItem.units,
          month: opts.month,
          year: opts.year,
          updatedAt: Date.now(),
        }

        await reportUsageQuery({
          projectId: opts.projectId,
          subscriptionItemId: opts.subItem.id,
          db: this.db,
          metrics: this.metrics,
          logger: this.logger,
          usage: usage,
        })

        return usage
      }
    )

    if (res.err) {
      this.logger.error(`Error in _getCustomerUsageFeature: ${res.err.message}`, {
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
      const usageData = await this.analytics
        .getUsageFeature({
          customerId: opts.customerId,
          featureSlug: opts.featureSlug,
          projectId: opts.projectId,
          start: new Date(opts.year, opts.month, 1).getTime(),
          end: new Date(opts.year, opts.month + 1).getTime(),
        })
        .then((usage) => usage.data[0])

      // this will be the usage of the feature for the period
      const data = usageData ? usageData[opts.subItem.aggregationMethod] || 0 : 0

      const usage = {
        usage: data,
        limit: opts.subItem.units,
        month: opts.month,
        year: opts.year,
        updatedAt: Date.now(),
      }

      if (!usage) {
        return Err(
          new UnPriceCustomerError({
            code: "FEATURE_HAS_NO_USAGE_RECORD",
            customerId: opts.customerId,
          })
        )
      }

      // save the data in the cache & report the usage to db
      this.waitUntil(
        Promise.all([
          this.cache.customerFeatureCurrentUsage.set(
            `${opts.customerId}:${opts.featureSlug}:${opts.year}:${opts.month}`,
            usage
          ),
          reportUsageQuery({
            projectId: opts.projectId,
            subscriptionItemId: opts.subItem.id,
            db: this.db,
            metrics: this.metrics,
            logger: this.logger,
            usage: usage,
          }),
        ])
      )

      return Ok(usage)
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
          // get the current usage
          const result = await this._getCustomerUsageFeature({
            subItem,
            customerId,
            projectId,
            featureSlug,
            year: year,
            month: month,
          })

          if (result.err) {
            this.logger.error("Error getting usage", {
              error: JSON.stringify(result.err),
              customerId: opts.customerId,
              featureSlug: opts.featureSlug,
              projectId: opts.projectId,
            })

            return Ok({
              access: false,
              deniedReason: "FEATURE_HAS_NO_USAGE_RECORD",
            })
          }

          const currentUsage = result.val
          const limit = currentUsage.limit
          const usage = currentUsage.usage

          if (limit && usage >= limit) {
            this.waitUntil(
              this.analytics.ingestFeaturesVerification({
                ...analyticsPayload,
                latency: performance.now() - start,
                deniedReason: "USAGE_EXCEEDED",
              })
            )

            return Ok({
              currentUsage: usage,
              limit: limit,
              featureType: subItem.featureType,
              access: false,
              deniedReason: "USAGE_EXCEEDED",
              remaining: limit - usage,
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
  }): Promise<Result<{ success: boolean }, UnPriceCustomerError | FetchError>> {
    try {
      const { customerId, featureSlug, projectId, usage, month, year } = opts

      // get the item details from the cache or the db
      const res = await this._getCustomerFeature({
        customerId,
        projectId,
        featureSlug,
      })

      if (res.err) {
        return res
      }

      const subItem = res.val

      // flat features don't have usage
      if (subItem.featureType === "flat") {
        return Ok({
          success: true,
        })
      }

      this.waitUntil(
        Promise.all([
          // just for notifying the customer if the usage is exceeding the limit
          this._getCustomerUsageFeature({
            subItem,
            customerId,
            projectId,
            featureSlug,
            year: year,
            month: month,
          }).then((currentUsage) => {
            if (currentUsage.err) {
              this.logger.warn("Usage error", {
                customerId: customerId,
                featureSlug: featureSlug,
                projectId: projectId,
                usage: usage,
                error: JSON.stringify(currentUsage.err),
              })

              return
            }

            if (!currentUsage.val) {
              this.logger.warn("Usage val is null", {
                customerId: customerId,
                featureSlug: featureSlug,
                projectId: projectId,
                currentUsage: JSON.stringify(currentUsage),
              })
              return
            }

            const limit = currentUsage.val.limit

            if (limit && usage >= limit) {
              this.logger.warn("Usage exceeded", {
                customerId: customerId,
                featureSlug: featureSlug,
                projectId: projectId,
                usage: usage,
                limit: limit,
              })
            }

            // notify also if the usage is negative
            if (usage < 0) {
              this.logger.warn("Negative usage", {
                customerId: customerId,
                featureSlug: featureSlug,
                projectId: projectId,
                usage: usage,
              })
            }
          }),

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
