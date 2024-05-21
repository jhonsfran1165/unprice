import { waitUntil } from "@vercel/functions"

import type { Database } from "@builderai/db"
import type {
  PlanVersionExtended,
  SubscriptionExtended,
} from "@builderai/db/validators"
import type { FetchError, Result } from "@builderai/error"
import { Err, Ok } from "@builderai/error"
import type { Analytics } from "@builderai/tinybird"

import type { Context } from "../trpc"
import type { UnpriceCache } from "./cache"
import type { DenyReason } from "./errors"
import { UnPriceCustomerError } from "./errors"

type FeatureResponse = Pick<
  PlanVersionExtended,
  "planFeatures"
>["planFeatures"][number]

export class UnpriceCustomer {
  private readonly cache: UnpriceCache
  private readonly db: Database
  private readonly analytics: Analytics

  constructor(opts: {
    cache: UnpriceCache
    db: Database
    analytics: Analytics
  }) {
    this.cache = opts.cache
    this.db = opts.db
    this.analytics = opts.analytics
  }

  public async getCustomerActiveSubs(opts: {
    customerId: string
    projectId: string
  }): Promise<
    Result<SubscriptionExtended[], UnPriceCustomerError | FetchError>
  > {
    const res = await this.cache.getCustomerActiveSubs(opts.customerId)

    if (res.err) {
      // TODO: sent log
      console.error(`Error getting cache for customer: ${res.err.message}`)
      return res
    }

    if (res.val && res.val.length > 0) {
      return Ok(res.val)
    }

    const customer = await this.db.query.customers.findFirst({
      with: {
        subscriptions: {
          columns: {
            id: true,
            planVersionId: true,
            customerId: true,
            status: true,
            items: true,
            metadata: true,
          },
          where: (sub, { eq }) => eq(sub.status, "active"),
          orderBy(fields, operators) {
            return [operators.desc(fields.startDate)]
          },
          with: {
            planVersion: {
              columns: {
                id: true,
                planId: true,
                status: true,
                planType: true,
                active: true,
                currency: true,
                billingPeriod: true,
                startCycle: true,
                gracePeriod: true,
                whenToBill: true,
                paymentProvider: true,
                metadata: true,
              },
              with: {
                plan: {
                  columns: {
                    slug: true,
                  },
                },
                planFeatures: {
                  columns: {
                    id: true,
                    featureId: true,
                    featureType: true,
                    planVersionId: true,
                    config: true,
                    metadata: true,
                    limit: true,
                  },
                  with: {
                    feature: {
                      columns: {
                        slug: true,
                        id: true,
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
        and(
          eq(customer.id, opts.customerId),
          eq(customer.projectId, opts.projectId)
        ),
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

    // cache the active subscriptions
    waitUntil(
      this.cache.setCustomerActiveSubs(customer.id, customer.subscriptions)
    )

    return Ok(customer.subscriptions)
  }

  public async getCustomerActiveSubByFeature(opts: {
    customerId: string
    projectId: string
    featureSlug: string
  }): Promise<
    Result<
      { feature: FeatureResponse; subscription: SubscriptionExtended },
      UnPriceCustomerError | FetchError
    >
  > {
    const res = await this.getCustomerActiveSubs({
      customerId: opts.customerId,
      projectId: opts.projectId,
    })

    // if we have an error, return it
    if (res.err) {
      console.error(`Error in getCustomerData: ${res.err.message}`)
      return res
    }

    const customerActiveSubs = res.val
    const allFeatures = new Map<string, FeatureResponse>()
    const allSubscriptions = new Map<string, SubscriptionExtended>()

    // get all the features and subscriptions
    // TODO: is it true to assume that a subscription can have the same features multiple times and we just overwrite to the latest one?
    customerActiveSubs.forEach((sub) => {
      sub.planVersion.planFeatures.forEach((pf) => {
        allFeatures.set(pf.feature.slug, pf)
      })

      allSubscriptions.set(sub.planVersionId, sub)
    })

    const feature = allFeatures.get(opts.featureSlug)

    if (!feature) {
      return Err(
        new UnPriceCustomerError({
          code: "FEATURE_NOT_FOUND_IN_SUBSCRIPTION",
          customerId: opts.customerId,
        })
      )
    }

    // we need the subscription for the feature apply checks later on
    const subscription = allSubscriptions.get(feature?.planVersionId)

    if (!subscription) {
      return Err(
        new UnPriceCustomerError({
          code: "CUSTOMER_HAS_NO_SUBSCRIPTIONS",
          customerId: opts.customerId,
        })
      )
    }

    return Ok({
      feature: feature,
      subscription: subscription,
    })
  }

  // TODO: i should be able to verify my feature and return false access if the feature not exist in the subscription
  public async verifyFeature(opts: {
    customerId: string
    featureSlug: string
    projectId: string
    workspaceId: string
    ctx: Context
  }): Promise<
    Result<
      {
        access: boolean
        currentUsage: number
        limit?: number
        deniedReason?: DenyReason
        currentPlan: string
        remaining?: number
        featureType: string
      },
      UnPriceCustomerError | FetchError
    >
  > {
    try {
      const { customerId, projectId, featureSlug, workspaceId } = opts
      const start = performance.now()

      const res = await this.getCustomerActiveSubByFeature({
        customerId,
        projectId,
        featureSlug,
      })

      if (res.err) {
        const error = res.err

        // TODO: sent log
        console.error(`Error in getCustomerData: ${res.err.message}`)
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

      const { feature, subscription } = res.val

      // basic data from the request
      const ip = opts.ctx.headers.get("x-real-ip") ?? ""
      const userAgent = opts.ctx.headers.get("user-agent") ?? ""

      const limit = subscription.items.find(
        (item) => item.itemId === feature.id
      )?.limit

      // TODO: add params to usage so we can count or max and get data by date
      const usage = await this.analytics
        .getUsageFeature({
          planVersionFeatureId: feature.id,
          workspaceId,
          customerId,
          projectId,
        })
        .then((res) => res.data.at(0)?.total_usage ?? 0)

      const analyticsPayload = {
        featureId: feature.featureId,
        planVersionFeatureId: feature.id,
        workspaceId: projectId,
        planVersionId: subscription.planVersionId,
        customerId,
        subscriptionId: subscription.id,
        projectId,
        time: Date.now(),
        ipAddress: ip,
        userAgent: userAgent,
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
              currentPlan: subscription.planVersion.plan.slug,
              remaining: limit - usage,
            })
          }

          // flat feature, just return the feature and the subscription
          break
        }

        case "flat": {
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
              currentPlan: subscription.planVersion.plan.slug,
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
              currentPlan: subscription.planVersion.plan.slug,
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
              currentPlan: subscription.planVersion.plan.slug,
              deniedReason: "USAGE_EXCEEDED",
              remaining: limit - usage,
            })
          }

          break
        }

        default:
          return Err(
            new UnPriceCustomerError({
              code: "FEATURE_TYPE_NOT_SUPPORTED",
              customerId,
            })
          )
      }

      waitUntil(
        this.analytics
          .ingestFeaturesVerification(analyticsPayload)
          .catch((error) => console.error("Error reporting usage", error))
      )

      return Ok({
        currentUsage: usage,
        featureType: feature.featureType,
        limit: limit,
        access: true,
        currentPlan: subscription.planVersion.plan.slug,
        remaining: limit ? limit - usage : undefined,
      })
    } catch (e) {
      const error = e as Error
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
    workspaceId: string
    usage: number
    ctx: Context
  }): Promise<Result<{ success: boolean }, UnPriceCustomerError | FetchError>> {
    try {
      const { customerId, featureSlug, projectId, usage, workspaceId, ctx } =
        opts
      const res = await this.getCustomerActiveSubByFeature({
        customerId,
        projectId,
        featureSlug,
      })

      if (res.err) {
        return res
      }

      const { feature, subscription } = res.val

      const ip = ctx.headers.get("x-real-ip") ?? ""
      const userAgent = ctx.headers.get("user-agent") ?? ""
      const start = performance.now()

      waitUntil(
        this.analytics
          .ingestFeaturesUsage({
            featureId: feature.featureId,
            planVersionFeatureId: feature.id,
            workspaceId: workspaceId,
            planVersionId: subscription.planVersionId,
            customerId,
            subscriptionId: subscription.id,
            usage: usage,
            projectId,
            time: Date.now(),
            ipAddress: ip,
            userAgent: userAgent,
            latency: performance.now() - start,
          })
          .catch((error) => {
            console.error("Error reporting usage", error)
            // TODO: save the log to tinybird
          })
      )

      return Ok({
        success: true,
      })
    } catch (e) {
      // TODO: log the error
      const error = e as Error
      throw e
    }
  }
}
