import type { Database } from "@builderai/db"

import type { FeatureType } from "@builderai/db/validators"
import { FetchError, type Result } from "@builderai/error"
import { Err, Ok } from "@builderai/error"
import type { Logger } from "@builderai/logging"
import type { Analytics } from "@builderai/tinybird"
import {
  createUsageQuery,
  getCustomerFeatureQuery,
  getCustomerFeatureUsageQuery,
  getEntitlementsQuery,
  reportUsageQuery,
} from "../queries"
import type { Context } from "../trpc"
import type { Cache } from "./cache"
import type { CacheNamespaces, CurrentUsageCached } from "./cache/namespaces"
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
  }): Promise<Result<CacheNamespaces["featureByCustomerId"], UnPriceCustomerError | FetchError>> {
    const res = await this.cache.featureByCustomerId.swr(
      `${opts.customerId}:${opts.featureSlug}`,
      async () => {
        return await getCustomerFeatureQuery({
          projectId: opts.projectId,
          featureSlug: opts.featureSlug,
          customerId: opts.customerId,
          db: this.db,
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
        db: this.db,
        metrics: this.metrics,
        logger: this.logger,
      })

      // save the data in the cache
      this.waitUntil(
        this.cache.featureByCustomerId.set(`${opts.customerId}:${opts.featureSlug}`, feature)
      )

      return Ok(feature)
    }

    return Ok(res.val)
  }

  // TODO: we have to calculate the usage depending on the feature type and the current configuration
  // we have to take into account the current month and year and the limit and the aggregated usage method
  // for reporting the usage we have to support negative values when the usage is negative
  private async _getCustomerUsageFeature(opts: {
    customerId: string
    projectId: string
    featureSlug: string
    year: number
    month: number
  }): Promise<Result<CurrentUsageCached, UnPriceCustomerError | FetchError>> {
    const res = await this.cache.customerFeatureCurrentUsage.swr(
      `${opts.customerId}:${opts.featureSlug}:${opts.year}:${opts.month}`,
      async () => {
        return await getCustomerFeatureUsageQuery({
          projectId: opts.projectId,
          featureSlug: opts.featureSlug,
          customerId: opts.customerId,
          db: this.db,
          metrics: this.metrics,
          logger: this.logger,
          year: opts.year,
          month: opts.month,
        })
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
      let usage = await getCustomerFeatureUsageQuery({
        projectId: opts.projectId,
        featureSlug: opts.featureSlug,
        customerId: opts.customerId,
        db: this.db,
        metrics: this.metrics,
        logger: this.logger,
        year: opts.year,
        month: opts.month,
      })

      // if the feature has no current usage for the month-year, we need to create it
      if (!usage) {
        usage = await createUsageQuery({
          projectId: opts.projectId,
          featureSlug: opts.featureSlug,
          customerId: opts.customerId,
          db: this.db,
          metrics: this.metrics,
          logger: this.logger,
          month: opts.month,
          year: opts.year,
        })
      }

      // save the data in the cache
      this.waitUntil(
        this.cache.customerFeatureCurrentUsage.set(
          `${opts.customerId}:${opts.featureSlug}:${opts.year}:${opts.month}`,
          usage
        )
      )

      return Ok(usage)
    }

    return Ok(res.val)
  }

  private async _getSubscriptions(opts: {
    customerId: string
    projectId: string
  }): Promise<
    Result<CacheNamespaces["subscriptionsByCustomerId"], UnPriceCustomerError | FetchError>
  > {
    const res = await this.cache.subscriptionsByCustomerId.get(opts.customerId)

    if (res.err) {
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
    const customer = await this.db.query.customers.findFirst({
      with: {
        subscriptions: {
          columns: {
            id: true,
          },
          where: (sub, { eq }) => eq(sub.status, "active"),
          orderBy(fields, operators) {
            return [operators.desc(fields.startDate)]
          },
        },
      },
      where: (customer, { eq, and }) =>
        and(eq(customer.id, opts.customerId), eq(customer.projectId, opts.projectId)),
    })

    if (!customer) {
      return Err(
        new UnPriceCustomerError({
          code: "CUSTOMER_NOT_FOUND",
          customerId: opts.customerId,
        })
      )
    }

    if (!customer.subscriptions || customer.subscriptions.length === 0) {
      return Err(
        new UnPriceCustomerError({
          code: "CUSTOMER_HAS_NO_SUBSCRIPTIONS",
          customerId: opts.customerId,
        })
      )
    }

    // get subscriptions Ids
    const subscriptionIds = customer.subscriptions.map((sub) => sub.id)

    // cache the active entitlements
    this.waitUntil(this.cache.subscriptionsByCustomerId.set(customer.id, subscriptionIds))

    return Ok(subscriptionIds)
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
      const { customerId, projectId, featureSlug } = opts
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
          // we don't have to report usage or check the usage
          // flat feature are like feature flags
          break
        }
        // the rest of the features need to check the usage
        case "usage":
        case "tier":
        case "package": {
          // for now only support the current month and year
          const today = new Date()
          const year = today.getFullYear()
          const month = today.getMonth() + 1

          // get the current usage
          const result = await this._getCustomerUsageFeature({
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

          if (!currentUsage) {
            return Ok({
              access: false,
              deniedReason: "FEATURE_HAS_NO_USAGE_RECORD",
            })
          }

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
            this.logger.error("Error reporting usage", {
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
    usage: number
  }): Promise<Result<{ success: boolean }, UnPriceCustomerError | FetchError>> {
    try {
      const { customerId, featureSlug, projectId, usage } = opts

      // for now only support the current month and year
      const today = new Date()
      const year = today.getFullYear()
      const month = today.getMonth() + 1

      const res = await this._getCustomerFeature({
        customerId,
        projectId,
        featureSlug,
      })

      if (res.err) {
        return res
      }

      const subItem = res.val

      if (!subItem) {
        return Err(
          new UnPriceCustomerError({
            code: "FEATURE_NOT_FOUND_IN_SUBSCRIPTION",
            customerId: opts.customerId,
          })
        )
      }

      if (subItem.featureType === "flat") {
        return Err(
          new UnPriceCustomerError({
            code: "FEATURE_NOT_SUPPORT_USAGE",
            customerId: opts.customerId,
          })
        )
      }

      this.waitUntil(
        Promise.all([
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
              this.logger.error("Error reporting usage ingestFeaturesUsage", {
                error: JSON.stringify(error),
                subItem: subItem,
                usage: usage,
              })
            }),
          // if there is no analytics, we should report the usage to the db
          // this will sum to the usage but we only use the analytics to report the usage when billing
          this.analytics.isNoop &&
            reportUsageQuery({
              projectId,
              subscriptionItemId: subItem.id,
              month: month,
              year: year,
              db: this.db,
              metrics: this.metrics,
              logger: this.logger,
              usage: usage,
            }),
        ])
      )

      return Ok({
        success: true,
      })
    } catch (e) {
      // TODO: log the error
      const error = e as Error
      console.error("Error reporting usage", error)
      throw e
    }
  }
}
