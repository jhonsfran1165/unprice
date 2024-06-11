import { waitUntil } from "@vercel/functions"

import type { Database } from "@builderai/db"

import { FetchError, type Result } from "@builderai/error"
import { Err, Ok } from "@builderai/error"
import type { Analytics } from "@builderai/tinybird"

import type { Logger } from "@builderai/logging"
import type { Context } from "../trpc"
import type { Cache } from "./cache"
import type { CacheNamespaces } from "./cache/namespaces"
import type { DenyReason } from "./errors"
import { UnPriceCustomerError } from "./errors"
import type { Metrics } from "./metrics"

export class UnpriceCustomer {
  private readonly cache: Cache
  private readonly db: Database
  private readonly metrics: Metrics
  private readonly logger: Logger
  private readonly analytics: Analytics

  constructor(opts: {
    cache: Cache
    metrics: Metrics
    db: Database
    analytics: Analytics
    logger: Logger
  }) {
    this.cache = opts.cache
    this.db = opts.db
    this.metrics = opts.metrics
    this.analytics = opts.analytics
    this.logger = opts.logger
  }

  public async getCustomerFeature(opts: {
    customerId: string
    projectId: string
    featureSlug: string
  }): Promise<Result<CacheNamespaces["featureByCustomerId"], UnPriceCustomerError | FetchError>> {
    const res = await this.cache.featureByCustomerId.swr(
      `${opts.customerId}:${opts.featureSlug}`,
      async () => {
        const start = performance.now()
        const feature = await this.db.query.subscriptionFeatures
          .findFirst({
            with: {
              featurePlan: {
                columns: {
                  id: true,
                  featureType: true,
                },
              },
            },
            where: (subFeature, { eq, and }) =>
              and(
                eq(subFeature.projectId, opts.projectId),
                eq(subFeature.featureSlug, opts.featureSlug)
              ),
          })
          .then((res) => {
            const response = res
              ? {
                  id: res.id,
                  projectId: res.projectId,
                  featureSlug: res.featureSlug,
                  featurePlanId: res.featurePlanId,
                  subscriptionId: res.subscriptionId,
                  quantity: res.quantity,
                  min: res.min,
                  limit: res.limit,
                  featureType: res.featurePlan.featureType,
                  usage: res.usage,
                }
              : null

            return response
          })

        const end = performance.now()

        console.log("adsdasdasd")
        this.metrics.emit({
          metric: "metric.db.read",
          query: "subscriptionFeatureBySlug",
          duration: end - start,
          service: "customer",
        })

        return feature
      }
    )

    if (res.err) {
      // TODO: sent log
      console.error(`Error getting cache for customer: ${res.err.message}`)
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
      // get the subscriptions for the customer
      const subscriptions = await this.getSubscriptions({
        customerId: opts.customerId,
        projectId: opts.projectId,
      })

      if (subscriptions.err) {
        return Err(
          new FetchError({
            message: "unable to fetch required data",
            retry: true,
            cause: res.err,
          })
        )
      }

      const subscriptionIds = subscriptions.val

      const feature = await this.db.query.subscriptionFeatures
        .findFirst({
          with: {
            featurePlan: {
              columns: {
                id: true,
                featureType: true,
              },
            },
          },
          where: (subFeature, { eq, and, inArray }) =>
            and(
              eq(subFeature.projectId, opts.projectId),
              eq(subFeature.featureSlug, opts.featureSlug),
              inArray(subFeature.subscriptionId, subscriptionIds)
            ),
        })
        .then((res) => {
          if (!res) {
            return Err(
              new UnPriceCustomerError({
                code: "FEATURE_NOT_FOUND_IN_SUBSCRIPTION",
                customerId: opts.customerId,
              })
            )
          }

          const response = {
            id: res.id,
            projectId: res.projectId,
            featureSlug: res.featureSlug,
            featurePlanId: res.featurePlanId,
            subscriptionId: res.subscriptionId,
            quantity: res.quantity,
            min: res.min,
            limit: res.limit,
            featureType: res.featurePlan.featureType,
            usage: res.usage,
          }

          // save the data in the cache
          waitUntil(
            this.cache.featureByCustomerId.set(`${opts.customerId}:${opts.featureSlug}`, response)
          )

          return Ok(response)
        })

      return feature
    }

    return Ok(res.val)
  }

  public async getSubscriptions(opts: {
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
    waitUntil(this.cache.subscriptionsByCustomerId.set(customer.id, subscriptionIds))

    return Ok(subscriptionIds)
  }

  public async getEntitlements(opts: {
    customerId: string
    projectId: string
  }): Promise<
    Result<CacheNamespaces["entitlementsByCustomerId"], UnPriceCustomerError | FetchError>
  > {
    const res = await this.cache.entitlementsByCustomerId.get(opts.customerId)

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
          with: {
            planVersion: {
              columns: {
                id: true,
              },
              with: {
                planFeatures: {
                  columns: {
                    id: true,
                  },
                  with: {
                    feature: {
                      columns: {
                        slug: true,
                      },
                    },
                  },
                },
              },
            },
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

    // get entitlements for every subscriptions, entitlements won't be repeated
    const entitlements = Array.from(
      new Set(
        customer.subscriptions.flatMap((sub) =>
          sub.planVersion.planFeatures.map((pf) => pf.feature.slug)
        )
      )
    )

    // cache the active entitlements
    waitUntil(this.cache.entitlementsByCustomerId.set(customer.id, entitlements))

    return Ok(entitlements)
  }

  // TODO: i should be able to verify my feature and return false access if the feature not exist in the subscription
  public async verifyFeature(opts: {
    customerId: string
    featureSlug: string
    projectId: string
    ctx: Context
  }): Promise<
    Result<
      {
        access: boolean
        currentUsage: number
        limit?: number
        deniedReason?: DenyReason
        remaining?: number
        featureType: string
      },
      UnPriceCustomerError | FetchError
    >
  > {
    try {
      const { customerId, projectId, featureSlug } = opts
      const start = performance.now()

      const res = await this.getCustomerFeature({
        customerId,
        projectId,
        featureSlug,
      })

      if (res.err) {
        const error = res.err

        // TODO: sent log
        console.error(`Error in getCustomerFeature: ${res.err.message}`)
        switch (true) {
          case error instanceof UnPriceCustomerError: {
            if (error.code === "FEATURE_NOT_FOUND_IN_SUBSCRIPTION") {
              return Ok({
                access: false,
                deniedReason: "FEATURE_NOT_FOUND_IN_SUBSCRIPTION",
                currentUsage: 0,
                currentPlan: "",
                featureType: "",
              })
            }

            return res
          }

          default:
            return res
        }
      }

      const feature = res.val

      if (!feature) {
        return Err(
          new UnPriceCustomerError({
            code: "FEATURE_NOT_FOUND_IN_SUBSCRIPTION",
            customerId: opts.customerId,
          })
        )
      }

      const limit = feature.limit
      const usage = feature.usage ?? 0

      const analyticsPayload = {
        projectId: feature.projectId,
        planVersionFeatureId: feature.featurePlanId,
        subscriptionId: feature.subscriptionId,
        time: Date.now(),
        latency: performance.now() - start,
      }

      switch (feature.featureType) {
        case "usage": {
          if (limit && usage >= limit) {
            waitUntil(
              this.analytics.ingestFeaturesVerification({
                ...analyticsPayload,
                deniedReason: "USAGE_EXCEEDED",
              })
            )

            return Ok({
              currentUsage: usage,
              featureType: feature.featureType,
              limit: limit,
              access: false,
              deniedReason: "USAGE_EXCEEDED",
              remaining: limit - usage,
            })
          }

          // flat feature, just return the feature and the subscription
          break
        }

        case "tier": {
          if (limit && usage >= limit) {
            waitUntil(
              this.analytics.ingestFeaturesVerification({
                ...analyticsPayload,
                deniedReason: "USAGE_EXCEEDED",
              })
            )
            return Ok({
              currentUsage: usage,
              limit: limit,
              featureType: feature.featureType,
              access: false,
              deniedReason: "USAGE_EXCEEDED",
              remaining: limit - usage,
            })
          }

          // flat feature, just return the feature and the subscription
          break
        }
        case "package": {
          if (limit && usage >= limit) {
            // TODO: what happens if we have for instance a feature call access with quantity 1, should we check the usage or the customer suppose to
            // have access to the feature if the quantity is 1?
            waitUntil(
              this.analytics.ingestFeaturesVerification({
                ...analyticsPayload,
                deniedReason: "USAGE_EXCEEDED",
              })
            )
            return Ok({
              currentUsage: usage,
              limit: limit,
              featureType: feature.featureType,
              access: false,
              deniedReason: "USAGE_EXCEEDED",
              remaining: limit - usage,
            })
          }

          break
        }

        default:
          break
      }

      waitUntil(
        this.analytics
          .ingestFeaturesVerification(analyticsPayload)
          .catch((error) => console.error("Error reporting usage", error))
      )

      return Ok({
        currentUsage: usage,
        featureType: feature.featureType,
        access: true,
      })
    } catch (e) {
      const error = e as Error
      console.error("Error getting customer data", error)
      // TODO: sent log
      // this.logger.error("Unhandled error while verifying key", {
      //   error: err.message,
      //   stack: JSON.stringify(err.stack),
      //   keyHash: await this.hash(req.key),
      //   apiId: req.apiId,
      // });

      throw e
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

      const start = performance.now()

      const res = await this.getCustomerFeature({
        customerId,
        projectId,
        featureSlug,
      })

      if (res.err) {
        return res
      }

      const feature = res.val

      if (!feature) {
        return Err(
          new UnPriceCustomerError({
            code: "FEATURE_NOT_FOUND_IN_SUBSCRIPTION",
            customerId: opts.customerId,
          })
        )
      }

      waitUntil(
        Promise.all([
          this.analytics
            .ingestFeaturesUsage({
              // TODO: add id of the subscription item
              planVersionFeatureId: feature.featurePlanId,
              subscriptionId: feature.subscriptionId,
              projectId: feature.projectId,
              usage: usage,
              time: Date.now(),
              latency: performance.now() - start,
            })
            .catch((error) => {
              console.error("Error reporting usage", error)
              // TODO: save the log to tinybird
            }),
          // set the usage in the cache
          this.cache.featureByCustomerId.set(`${opts.customerId}:${opts.featureSlug}`, {
            ...feature,
            usage: Number(feature.usage) + usage,
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
