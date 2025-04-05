import { type Database, type TransactionDatabase, and, eq, gte, lte } from "@unprice/db"

import {
  customerEntitlements,
  customerSessions,
  customers,
  features,
  planVersionFeatures,
  subscriptions,
} from "@unprice/db/schema"
import { AesGCM, newId } from "@unprice/db/utils"
import type { AggregationMethod, CustomerSignUp } from "@unprice/db/validators"
import { Err, FetchError, Ok, type Result, wrapResult } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import { env } from "../../env"
import type {
  CustomerEntitlementCache,
  CustomerEntitlementsCache,
  SubcriptionCache,
} from "../cache"
import type { Cache } from "../cache/service"
import type { Metrics } from "../metrics"
import { PaymentProviderService } from "../payment-provider/service"
import { SubscriptionService } from "../subscriptions/service"
import { retry } from "../utils/retry"
import { UnPriceCustomerError } from "./errors"

export class CustomerService {
  private readonly db: Database | TransactionDatabase
  private readonly logger: Logger
  private readonly analytics: Analytics
  private readonly cache: Cache
  private readonly metrics: Metrics
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private readonly waitUntil: (promise: Promise<any>) => void

  constructor({
    db,
    logger,
    analytics,
    waitUntil,
    cache,
    metrics,
  }: {
    db: Database | TransactionDatabase
    logger: Logger
    analytics: Analytics
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    waitUntil: (promise: Promise<any>) => void
    cache: Cache
    metrics: Metrics
  }) {
    this.db = db
    this.logger = logger
    this.analytics = analytics
    this.waitUntil = waitUntil
    this.cache = cache
    this.metrics = metrics
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
        throw e
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

  public async getActiveSubscription(
    customerId: string,
    projectId: string,
    now: number,
    opts?: {
      skipCache: boolean
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
              message: "unable to query db for active subscription",
              retry: false,
              context: {
                error: err.message,
                url: "",
                customerId: customerId,
                method: "getActiveSubscription",
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
            this.logger.warn("Failed to fetch subscription data from cache, retrying...", {
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
          retry: false,
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
  }): Promise<
    Result<{ usage: number; accumulatedUsage: number }, FetchError | UnPriceCustomerError>
  > {
    const start = performance.now()
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
              this.logger.error("error getting usage from analytics", {
                error: error.message,
                customerId,
                method: "getFeaturesUsageTotal",
                featureSlug,
                startAt,
                endAt,
              })

              throw new FetchError({
                message: error.message,
                retry: false,
              })
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
          this.logger.error("error getting usage from analytics", {
            error: error.message,
            customerId,
            method: "getFeaturesUsagePeriod",
            featureSlug,
            startAt,
            endAt,
          })

          throw new FetchError({
            message: error.message,
            retry: false,
          })
        }),
    ])

    const end = performance.now()

    this.metrics.emit({
      metric: "metric.analytics.read",
      query: "getUsageFromAnalytics",
      duration: end - start,
      service: "customer",
      customerId,
      featureSlug,
      projectId,
      isAccumulated,
      start,
      end,
    })

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

    return Ok({
      usage,
      accumulatedUsage,
    })
  }

  private async getEntitlementsData({
    customerId,
    projectId,
    now,
  }: {
    customerId: string
    projectId: string
    now: number
  }): Promise<CustomerEntitlementsCache[] | null> {
    const start = performance.now()

    // if not found in DO, then we query the db
    const entitlements = await this.db.query.customerEntitlements.findMany({
      with: {
        featurePlanVersion: {
          columns: {
            aggregationMethod: true,
            featureType: true,
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
      columns: {
        validFrom: true,
        validTo: true,
      },
      where: (entitlement, { and, eq, gte, lte, isNull, or }) =>
        and(
          eq(entitlement.customerId, customerId),
          eq(entitlement.projectId, projectId),
          eq(entitlement.active, true),
          lte(entitlement.validFrom, now),
          or(isNull(entitlement.validTo), gte(entitlement.validTo, now))
        ),
    })

    const end = performance.now()

    this.metrics.emit({
      metric: "metric.db.read",
      query: "getActiveEntitlements",
      duration: end - start,
      service: "customer",
      customerId,
      projectId,
    })

    if (entitlements.length === 0) {
      return null
    }

    const result = entitlements.map((entitlement) => ({
      featureType: entitlement.featurePlanVersion.featureType,
      featureSlug: entitlement.featurePlanVersion.feature.slug,
      validFrom: entitlement.validFrom,
      validTo: entitlement.validTo,
    }))

    return result
  }

  public async getActiveEntitlements({
    customerId,
    projectId,
    now,
    opts,
  }: {
    customerId: string
    projectId: string
    now: number
    opts?: {
      skipCache?: boolean // skip cache to force revalidation
    }
  }): Promise<Result<CustomerEntitlementsCache[] | null, FetchError | UnPriceCustomerError>> {
    // first try to get the entitlement from cache, if not found try to get it from DO,
    const { val, err } = opts?.skipCache
      ? await wrapResult(
          this.getEntitlementsData({
            customerId,
            projectId,
            now,
          }),
          (err) =>
            new FetchError({
              message: "unable to query entitlement from db",
              retry: false,
              context: {
                error: err.message,
                url: "",
                customerId: customerId,
                method: "getActiveEntitlement",
              },
            })
        )
      : await retry(
          3,
          async () =>
            this.cache.customerEntitlements.swr(`${customerId}`, () =>
              this.getEntitlementsData({
                customerId,
                projectId,
                now,
              })
            ),
          (attempt, err) => {
            this.logger.warn("Failed to fetch entitlements data from cache, retrying...", {
              customerId: customerId,
              attempt,
              error: err.message,
            })
          }
        )

    if (err) {
      this.logger.error("error getting entitlements", {
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

    return Ok(val)
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
      withLastUsage?: boolean
    }
  }): Promise<CustomerEntitlementCache | null> {
    const start = performance.now()

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
        this.logger.error("error getting entitlement", {
          error: e.message,
          customerId,
          featureSlug,
          projectId,
          now,
        })

        throw e
      })

    const end = performance.now()

    this.metrics.emit({
      metric: "metric.db.read",
      query: "getActiveEntitlement",
      duration: end - start,
      service: "customer",
      customerId,
      featureSlug,
      projectId,
    })

    if (!entitlement || !entitlement.featureType || !entitlement.aggregationMethod) {
      return null
    }

    // get the usage from analytics if the entitlement was updated more than 1 minute ago
    if (
      opts?.withLastUsage ||
      entitlement.customerEntitlement.lastUsageUpdateAt < Date.now() - 60_000
    ) {
      const { err, val } = await this.getUsageFromAnalytics({
        customerId,
        projectId,
        featureSlug,
        startAt: entitlement.customerEntitlement.validFrom,
        endAt: now,
        aggregationMethod: entitlement.aggregationMethod,
      })

      if (err) {
        throw err
      }

      const result = {
        ...entitlement.customerEntitlement,
        featureType: entitlement.featureType,
        aggregationMethod: entitlement.aggregationMethod,
        usage: val.usage.toString(),
        accumulatedUsage: val.accumulatedUsage.toString(),
        featureSlug,
      }

      // update the entitlement with the new usage
      this.waitUntil(
        this.db
          .update(customerEntitlements)
          .set({
            usage: val.usage.toString(),
            accumulatedUsage: val.accumulatedUsage.toString(),
            lastUsageUpdateAt: Date.now(),
          })
          .where(eq(customerEntitlements.id, entitlement.customerEntitlement.id))
      )

      return result
    }

    const result = {
      ...entitlement.customerEntitlement,
      featureType: entitlement.featureType,
      aggregationMethod: entitlement.aggregationMethod,
      featureSlug,
    }

    return result
  }

  public async getActiveEntitlement(
    customerId: string,
    featureSlug: string,
    projectId: string,
    now: number,
    opts?: {
      skipCache?: boolean // skip cache to force revalidation
      withLastUsage?: boolean // if true, we will get the last usage from analytics
    }
  ): Promise<Result<CustomerEntitlementCache | null, FetchError | UnPriceCustomerError>> {
    // first try to get the entitlement from cache, if not found try to get it from DO,
    const { val, err } = opts?.skipCache
      ? await wrapResult(
          this.getEntitlementData({
            customerId,
            featureSlug,
            projectId,
            now,
            opts: {
              withLastUsage: opts?.withLastUsage,
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
                method: "getActiveEntitlement",
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
    const validUntil = val.validTo ? val.validTo + bufferPeriod : null
    const active = val.active

    if (now < val.validFrom || (validUntil && now > validUntil)) {
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
          code: "PLAN_VERSION_NOT_FOUND",
          message: "Plan version not found",
        })
      )
    }

    if (planVersion.status !== "published") {
      return Err(
        new UnPriceCustomerError({
          code: "PLAN_VERSION_NOT_PUBLISHED",
          message: "Plan version is not published",
        })
      )
    }

    if (planVersion.active === false) {
      return Err(
        new UnPriceCustomerError({
          code: "PLAN_VERSION_NOT_ACTIVE",
          message: "Plan version is not active",
        })
      )
    }

    const planProject = planVersion.project
    const paymentProvider = planVersion.paymentProvider
    const paymentRequired = planVersion.paymentMethodRequired

    const customerId = newId("customer")
    const customerSuccessUrl = successUrl.replace("{CUSTOMER_ID}", customerId)

    // For the main project we use the default key
    // get config payment provider
    const configPaymentProvider = await this.db.query.paymentProviderConfig.findFirst({
      where: (config, { and, eq }) =>
        and(
          eq(config.projectId, projectId),
          eq(config.paymentProvider, paymentProvider),
          eq(config.active, true)
        ),
    })

    if (!configPaymentProvider) {
      return Err(
        new UnPriceCustomerError({
          code: "PAYMENT_PROVIDER_CONFIG_NOT_FOUND",
          message: "Payment provider config not found or not active",
        })
      )
    }

    const aesGCM = await AesGCM.withBase64Key(env.ENCRYPTION_KEY)

    const decryptedKey = await aesGCM.decrypt({
      iv: configPaymentProvider.keyIv,
      ciphertext: configPaymentProvider.key,
    })

    // if payment is required, we need to go through payment provider flow first
    if (paymentRequired) {
      const paymentProviderService = new PaymentProviderService({
        logger: this.logger,
        paymentProvider: paymentProvider,
        token: decryptedKey,
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
            paymentMethodRequired: paymentRequired,
          },
        })
        .returning()
        .then((data) => data[0])

      if (!customerSession) {
        return Err(
          new UnPriceCustomerError({
            code: "CUSTOMER_SESSION_NOT_CREATED",
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
          projectId: projectId,
        },
      })

      if (err ?? !val) {
        return Err(
          new UnPriceCustomerError({
            code: "PAYMENT_PROVIDER_ERROR",
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
              code: "CUSTOMER_NOT_CREATED",
              message: "Error creating customer",
            })
          )
        }

        const subscriptionService = new SubscriptionService({
          logger: this.logger,
          analytics: this.analytics,
          waitUntil: this.waitUntil,
          cache: this.cache,
          metrics: this.metrics,
          // pass the transaction to the subscription service
          // so we can rollback the transaction if something goes wrong
          db: trx,
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
                config: config,
                paymentMethodRequired: planVersion.paymentMethodRequired,
                customerId: newCustomer.id,
              },
            ],
          },
          projectId: projectId,
        })

        if (err) {
          this.logger.error("Error creating subscription", {
            error: err.message,
          })

          trx.rollback()
          throw err
        }

        if (!newSubscription?.id) {
          return Err(
            new UnPriceCustomerError({
              code: "SUBSCRIPTION_NOT_CREATED",
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

  // TODO: to implement
  // signout means cancel all subscriptions and deactivate the customer
  // cancel all entitlements
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
        customerSubs.map(async () => {
          // TODO: cancel the subscription
          return true
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
            code: "SUBSCRIPTION_NOT_CANCELED",
            message: "Error canceling subscription",
          })
        )
      }

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
