import { type Database, type TransactionDatabase, eq } from "@unprice/db"

import { customerSessions, customers, subscriptions } from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"
import type { CustomerEntitlement, CustomerSignUp, FeatureType } from "@unprice/db/validators"
import { Err, FetchError, Ok, type Result } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import type { Cache, CacheNamespaces } from "../cache"
import type { Metrics } from "../metrics"
import { PaymentProviderService } from "../payment-provider"
import { SubscriptionService } from "../subscriptions"
import type { DenyReason } from "./errors"
import { UnPriceCustomerError } from "./errors"
import { getEntitlementsQuery } from "./queries"

export class CustomerService {
  private readonly cache: Cache
  private readonly db: Database | TransactionDatabase
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

  private async _getCustomerEntitlement(opts: {
    customerId: string
    projectId: string
    featureSlug: string
    month: number
    year: number
  }): Promise<
    Result<
      Omit<CustomerEntitlement, "createdAtM" | "updatedAtM">,
      UnPriceCustomerError | FetchError
    >
  > {
    const res = await this.cache.featureByCustomerId.swr(
      `${opts.customerId}:${opts.featureSlug}`,
      async () => {
        return await this.db.query.customerEntitlements.findFirst({
          where: (ent, { eq, and, gte, lte, isNull, or }) =>
            and(
              eq(ent.customerId, opts.customerId),
              eq(ent.projectId, opts.projectId),
              lte(ent.startAt, Date.now()),
              or(isNull(ent.endAt), gte(ent.endAt, Date.now())),
              eq(ent.featureSlug, opts.featureSlug)
            ),
        })
      }
    )

    if (res.err) {
      this.logger.error(`Error in _getCustomerEntitlement: ${res.err.message}`, {
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
      const feature = await this.db.query.customerEntitlements.findFirst({
        where: (ent, { eq, and, gte, lte, isNull, or }) =>
          and(
            eq(ent.customerId, opts.customerId),
            eq(ent.projectId, opts.projectId),
            lte(ent.startAt, Date.now()),
            or(isNull(ent.endAt), gte(ent.endAt, Date.now())),
            eq(ent.featureSlug, opts.featureSlug)
          ),
      })

      if (!feature) {
        return Err(
          new UnPriceCustomerError({
            code: "FEATURE_OR_CUSTOMER_NOT_FOUND",
            customerId: opts.customerId,
          })
        )
      }

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

  public async verifyEntitlement(opts: {
    customerId: string
    featureSlug: string
    projectId: string
    month: number
    year: number
  }): Promise<
    Result<
      {
        access: boolean
        currentUsage?: number
        limit?: number
        deniedReason?: DenyReason
        remaining?: number
        featureType?: FeatureType
        units?: number
      },
      UnPriceCustomerError | FetchError
    >
  > {
    try {
      const { customerId, projectId, featureSlug, month, year } = opts
      const start = performance.now()

      const res = await this._getCustomerEntitlement({
        customerId,
        projectId,
        featureSlug,
        month,
        year,
      })

      if (res.err) {
        const error = res.err

        this.logger.error("Error in ve", {
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

      const entitlementId = res.val

      if (!entitlementId) {
        return Ok({
          access: false,
          deniedReason: "FEATURE_NOT_FOUND_IN_SUBSCRIPTION",
        })
      }

      const analyticsPayload = {
        projectId: entitlementId.projectId,
        planVersionFeatureId: entitlementId.featurePlanVersionId,
        subscriptionItemId: entitlementId.subscriptionItemId,
        entitlementId: entitlementId.id,
        featureSlug: featureSlug,
        customerId: customerId,
        time: Date.now(),
      }

      switch (entitlementId.featureType) {
        case "flat": {
          // flat feature are like feature flags
          break
        }
        // the rest of the features need to check the usage
        case "usage":
        case "tier":
        case "package": {
          const currentUsage = entitlementId.usage ?? 0
          const limit = entitlementId.limit
          const units = entitlementId.units
          // remaining usage given the units the user bought
          const remainingUsage = units ? units - currentUsage : undefined
          const remainingToLimit = limit ? limit - currentUsage : undefined

          // check limits first
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
              units: units ?? undefined,
              featureType: entitlementId.featureType,
              access: false,
              deniedReason: "LIMIT_EXCEEDED",
              remaining: remainingToLimit,
            })
          }

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
              featureType: entitlementId.featureType,
              units: units ?? undefined,
              access: false,
              deniedReason: "USAGE_EXCEEDED",
              remaining: remainingUsage,
            })
          }

          break
        }

        default:
          this.logger.error("Unhandled feature type", {
            featureType: entitlementId.featureType,
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
            this.logger.error("Error reporting usage to analytics ve", {
              error: JSON.stringify(error),
              analyticsPayload,
            })
          )
      )

      return Ok({
        featureType: entitlementId.featureType,
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
      const res = await this._getCustomerEntitlement({
        customerId,
        projectId,
        featureSlug,
        month,
        year,
      })

      if (res.err) {
        return res
      }

      const entitlement = res.val

      // TODO: should I report the usage even if the limit was exceeded?
      // for now let the customer report more usage than the limit but add notifications
      const threshold = 80 // notify when the usage is 80% or more
      const currentUsage = entitlement.usage ?? 0
      const limit = entitlement.limit
      const units = entitlement.units
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
      if (entitlement.featureType === "flat") {
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
              planVersionFeatureId: entitlement.featurePlanVersionId,
              subscriptionItemId: entitlement.subscriptionItemId,
              projectId: entitlement.projectId,
              usage: usage,
              time: Date.now(),
              month: month,
              year: year,
              entitlementId: entitlement.id,
              featureSlug: featureSlug,
              customerId: customerId,
            })
            .then(() => {
              // TODO: Only available in pro plus plan
              // TODO: usage is not always sum to the current usage, could be counter, etc
              // also if there are many request per second, we could debounce the update somehow
              if (entitlement.realtime) {
                this.cache.featureByCustomerId.set(
                  `${customerId}:${featureSlug}:${year}:${month}`,
                  {
                    ...entitlement,
                    usage: (entitlement.usage ?? 0) + usage,
                    lastUpdatedAt: Date.now(),
                  }
                )
              }
            })
            .catch((error) => {
              this.logger.error("Error reporting usage to analytics ingestFeaturesUsage", {
                error: JSON.stringify(error),
                entitlement: entitlement,
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

  public async signUp(opts: {
    input: CustomerSignUp
    projectId: string
  }): Promise<
    Result<
      { success: boolean; url: string; error?: string; customerId: string },
      UnPriceCustomerError | FetchError
    >
  > {
    const { input, projectId } = opts
    const {
      planVersionId,
      config,
      successUrl,
      cancelUrl,
      email,
      name,
      timezone,
      defaultCurrency,
      externalId,
    } = input

    const planVersion = await this.db.query.versions.findFirst({
      with: {
        project: true,
        plan: true,
      },
      where: (version, { eq, and }) =>
        and(eq(version.id, planVersionId), eq(version.projectId, projectId)),
    })

    if (!planVersion) {
      return Err(
        new UnPriceCustomerError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Plan version not found",
        })
      )
    }

    if (planVersion.status !== "published") {
      return Err(
        new UnPriceCustomerError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Plan version is not published",
        })
      )
    }

    if (planVersion.active === false) {
      return Err(
        new UnPriceCustomerError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Plan version is not active",
        })
      )
    }

    const planProject = planVersion.project
    const paymentProvider = planVersion.paymentProvider
    const paymentRequired = planVersion.paymentMethodRequired

    const customerId = newId("customer")
    const customerSuccessUrl = successUrl.replace("{CUSTOMER_ID}", customerId)

    // if payment is required, we need to go through payment provider flow first
    if (paymentRequired) {
      const paymentProviderService = new PaymentProviderService({
        logger: this.logger,
        paymentProviderId: paymentProvider,
      })

      // create a session with the data of the customer, the plan version and the success and cancel urls
      // pass the session id to stripe metadata and then once the customer adds a payment method, we call our api to create the subscription
      const sessionId = newId("customer_session")
      const customerSession = await this.db
        .insert(customerSessions)
        .values({
          id: sessionId,
          customer: {
            id: customerId,
            name: name,
            email: email,
            currency: defaultCurrency || planProject.defaultCurrency,
            timezone: timezone || planProject.timezone,
            projectId: projectId,
            externalId: externalId,
          },
          planVersion: {
            id: planVersion.id,
            projectId: projectId,
            config: config,
          },
        })
        .returning()
        .then((data) => data[0])

      if (!customerSession) {
        return Err(
          new UnPriceCustomerError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error creating customer session",
          })
        )
      }

      const { err, val } = await paymentProviderService.signUp({
        successUrl: customerSuccessUrl,
        cancelUrl: cancelUrl,
        customerSessionId: customerSession.id,
        customer: {
          id: customerId,
          email: email,
          currency: defaultCurrency || planProject.defaultCurrency,
        },
      })

      if (err ?? !val) {
        return Err(
          new UnPriceCustomerError({
            code: "INTERNAL_SERVER_ERROR",
            message: err.message,
          })
        )
      }

      return Ok({
        success: true,
        url: val.url,
        customerId: val.customerId,
      })
    }

    // if payment is not required, we can create the customer directly with its subscription
    try {
      await this.db.transaction(async (trx) => {
        const newCustomer = await trx
          .insert(customers)
          .values({
            id: customerId,
            name: name ?? email,
            email: email,
            projectId: projectId,
            defaultCurrency: defaultCurrency ?? planProject.defaultCurrency,
            timezone: timezone ?? planProject.timezone,
            active: true,
          })
          .returning()
          .then((data) => data[0])

        if (!newCustomer?.id) {
          return Err(
            new UnPriceCustomerError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Error creating customer",
            })
          )
        }

        const subscriptionService = new SubscriptionService({
          db: trx,
          cache: this.cache,
          metrics: this.metrics,
          logger: this.logger,
          waitUntil: this.waitUntil,
          analytics: this.analytics,
        })

        const { err, val: newSubscription } = await subscriptionService.createSubscription({
          input: {
            customerId: newCustomer.id,
            projectId: projectId,
            timezone: timezone ?? planProject.timezone,
            phases: [
              {
                planVersionId: planVersion.id,
                startAt: Date.now(),
                active: true,
                config: config,
                collectionMethod: planVersion.collectionMethod,
                whenToBill: planVersion.whenToBill,
                startCycle: planVersion.startCycle ?? 1,
                gracePeriod: planVersion.gracePeriod ?? 0,
              },
            ],
          },
          projectId: projectId,
        })

        if (err) {
          this.logger.error("Error creating subscription", {
            error: JSON.stringify(err),
          })

          trx.rollback()
          throw err
        }

        if (!newSubscription?.id) {
          return Err(
            new UnPriceCustomerError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Error creating subscription",
            })
          )
        }

        return { newCustomer, newSubscription }
      })

      return Ok({
        success: true,
        url: customerSuccessUrl,
        customerId: customerId,
      })
    } catch (error) {
      const err = error as Error

      return Ok({
        success: false,
        url: cancelUrl,
        error: `Error while signing up: ${err.message}`,
        customerId: "",
      })
    }
  }

  public async signOut(opts: {
    customerId: string
    projectId: string
  }): Promise<Result<{ success: boolean; message?: string }, UnPriceCustomerError | FetchError>> {
    const { customerId, projectId } = opts

    // cancel all subscriptions
    const customerSubs = await this.db.query.subscriptions.findMany({
      where: (subscription, { eq, and }) =>
        and(eq(subscription.customerId, customerId), eq(subscription.projectId, projectId)),
    })

    // all this should be in a transaction
    await this.db.transaction(async (tx) => {
      const cancelSubs = await Promise.all(
        customerSubs.map(async (sub) => {
          // check if the subscription is in trials, if so set the endAt to the trialEndsAt
          const endDate = sub.cancelAt
            ? sub.cancelAt > Date.now()
              ? sub.cancelAt
              : Date.now()
            : Date.now()

          await tx
            .update(subscriptions)
            .set({
              status: "canceled",
              metadata: {
                reason: "user_requested",
              },
              canceledAt: endDate,
            })
            .where(eq(subscriptions.id, sub.id))
        })
      )
        .catch((err) => {
          return Err(
            new FetchError({
              message: err.message,
              retry: false,
            })
          )
        })
        .then(() => true)

      if (!cancelSubs) {
        return Err(
          new UnPriceCustomerError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error canceling subscription",
          })
        )
      }

      // TODO: trigger payment to collect the last bill

      // TODO: send email to the customer

      // Deactivate the customer
      await tx
        .update(customers)
        .set({
          active: false,
        })
        .where(eq(customers.id, customerId))
        .catch((err) => {
          return Err(
            new FetchError({
              message: err.message,
              retry: false,
            })
          )
        })
    })

    return Ok({
      success: true,
    })
  }
}
