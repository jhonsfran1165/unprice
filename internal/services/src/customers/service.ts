import { type Database, type TransactionDatabase, and, eq, gte, isNull, lte, or } from "@unprice/db"

import {
  customerEntitlements,
  customerSessions,
  customers,
  features,
  planVersionFeatures,
  subscriptions,
} from "@unprice/db/schema"
import { AesGCM, newId } from "@unprice/db/utils"
import type {
  AggregationMethod,
  Customer,
  CustomerPaymentMethod,
  CustomerSignUp,
  PaymentProvider,
  Plan,
  PlanVersion,
  Project,
} from "@unprice/db/validators"
import { Err, FetchError, Ok, type Result, wrapResult } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import { env } from "../../env"
import type {
  CustomerCache,
  CustomerEntitlementCache,
  CustomerEntitlementsCache,
  SubcriptionCache,
  SubscriptionPhaseCache,
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

  private async getActivePhaseData({
    customerId,
    projectId,
    now,
  }: {
    customerId: string
    projectId: string
    now: number
  }): Promise<SubscriptionPhaseCache | null> {
    const subscription = await this.db.query.subscriptions
      .findFirst({
        with: {
          phases: {
            with: {
              planVersion: true,
              customerEntitlements: {
                with: {
                  featurePlanVersion: {
                    with: {
                      feature: true,
                    },
                  },
                },
              },
            },
            where: (phase, { and, or, isNull, gte, lte }) =>
              and(lte(phase.startAt, now), or(isNull(phase.endAt), gte(phase.endAt, now))),
            limit: 1,
          },
        },
        where: (subscription, { eq, and }) =>
          and(
            eq(subscription.customerId, customerId),
            eq(subscription.active, true),
            eq(subscription.projectId, projectId)
          ),
      })
      .catch((e) => {
        this.logger.error("error getting active phase data", {
          error: e.message,
        })

        throw e
      })

    // return explicitly null to avoid cache miss
    // this is useful to avoid cache revalidation on keys that don't exist
    if (!subscription) {
      return null
    }

    const phase = subscription.phases[0]

    if (!phase) {
      return null
    }

    return phase
  }

  private async getActiveSubscriptionData({
    customerId,
    projectId,
  }: {
    customerId: string
    projectId: string
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
          eq(subscriptions.projectId, projectId)
        ),
      })
      .catch((e) => {
        this.logger.error("error getting active subscription data", {
          error: e.message,
        })

        throw e
      })

    // return explicitly null to avoid cache miss
    // this is useful to avoid cache revalidation on keys that don't exist
    if (!subscription) {
      return null
    }

    return subscription
  }

  private async getCustomerData(customerId: string): Promise<CustomerCache | null> {
    const customer = await this.db.query.customers.findFirst({
      with: {
        project: {
          with: {
            workspace: true,
          },
        },
      },
      where: (customer, { eq }) => eq(customer.id, customerId),
    })

    if (!customer) {
      return null
    }

    return customer
  }

  public async getCustomer(
    customerId: string,
    opts?: {
      skipCache: boolean
    }
  ): Promise<Result<CustomerCache | null, FetchError | UnPriceCustomerError>> {
    const { val, err } = opts?.skipCache
      ? await wrapResult(
          this.getCustomerData(customerId),
          (err) =>
            new FetchError({
              message: `unable to query db for customer, ${err.message}`,
              retry: false,
            })
        )
      : await retry(
          3,
          async () => this.cache.customer.swr(customerId, () => this.getCustomerData(customerId)),
          (attempt, err) => {
            this.logger.warn("Failed to fetch customer data from cache, retrying...", {
              customerId: customerId,
              attempt,
              error: err.message,
            })
          }
        )

    if (err) {
      this.logger.error("error getting customer data", {
        error: err.message,
      })

      return Err(
        new FetchError({ message: `unable to query db for customer, ${err.message}`, retry: false })
      )
    }

    if (!val) {
      return Ok(null)
    }

    return Ok(val)
  }

  public async getActiveSubscription(
    customerId: string,
    projectId: string,
    opts?: {
      skipCache: boolean
    }
  ): Promise<Result<SubcriptionCache | null, FetchError | UnPriceCustomerError>> {
    if (opts?.skipCache) {
      this.logger.info("skipping cache for active subscription", {
        customerId,
        projectId,
      })
    }

    // swr handle cache stampede and other problems for us :)
    const { val, err } = opts?.skipCache
      ? await wrapResult(
          this.getActiveSubscriptionData({
            customerId,
            projectId,
          }),
          (err) =>
            new FetchError({
              message: `unable to query db for active subscription, ${err.message}`,
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
      this.logger.error("error getting customer subscription", {
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
    // const bufferPeriod = 24 * 60 * 60 * 1000 // 1 day
    // const validUntil = val.currentCycleEndAt + bufferPeriod
    // const validFrom = val.currentCycleStartAt

    // if (now < validFrom || now > validUntil) {
    //   return Err(
    //     new UnPriceCustomerError({ code: "SUBSCRIPTION_EXPIRED", message: "subscription expired" })
    //   )
    // }

    return Ok(val)
  }

  public async getActivePhase({
    customerId,
    projectId,
    now,
    opts,
  }: {
    customerId: string
    projectId: string
    now: number
    opts?: {
      skipCache: boolean
    }
  }): Promise<Result<SubscriptionPhaseCache | null, FetchError | UnPriceCustomerError>> {
    const { val, err } = opts?.skipCache
      ? await wrapResult(
          this.getActivePhaseData({
            customerId,
            projectId,
            now,
          }),
          (err) =>
            new FetchError({
              message: "unable to query db for active phase",
              retry: false,
              context: {
                error: err.message,
                url: "",
                customerId: customerId,
                method: "getActivePhase",
              },
            })
        )
      : await retry(
          3,
          async () =>
            this.cache.customerActivePhase.swr(`${customerId}`, () =>
              this.getActivePhaseData({
                customerId,
                projectId,
                now,
              })
            ),
          (attempt, err) => {
            this.logger.warn("Failed to fetch active phase data from cache, retrying...", {
              customerId: customerId,
              attempt,
              error: err.message,
            })
          }
        )

    if (err) {
      this.logger.error("error getting active phase", {
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

    return Ok(val)
  }

  private async getUsagePerFeatureFromAnalytics({
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
      query: "getUsagePerFeatureFromAnalytics",
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
        id: true,
        validFrom: true,
        validTo: true,
        usage: true,
        limit: true,
        featurePlanVersionId: true,
        units: true,
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
      usage: entitlement.usage,
      limit: entitlement.limit,
      featurePlanVersionId: entitlement.featurePlanVersionId,
      units: entitlement.units,
      aggregationMethod: entitlement.featurePlanVersion.aggregationMethod,
      id: entitlement.id,
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
      withLastUsage?: boolean // if true, we will get the last usage from analytics
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
          or(isNull(customerEntitlements.validTo), gte(customerEntitlements.validTo, now))
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
      const { err, val } = await this.getUsagePerFeatureFromAnalytics({
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

  public async getPaymentProvider({
    customerId,
    projectId,
    provider,
  }: {
    customerId?: string
    projectId: string
    provider: PaymentProvider
  }): Promise<Result<PaymentProviderService, FetchError | UnPriceCustomerError>> {
    let customerData: Customer | undefined

    // validate customer if provided
    if (customerId) {
      customerData = await this.db.query.customers.findFirst({
        where: (customer, { and, eq }) => and(eq(customer.id, customerId)),
      })

      if (!customerData) {
        return Err(
          new UnPriceCustomerError({
            code: "CUSTOMER_NOT_FOUND",
            message: "Customer not found",
          })
        )
      }
    }

    // get config payment provider
    const config = await this.db.query.paymentProviderConfig
      .findFirst({
        where: (config, { and, eq }) =>
          and(
            eq(config.projectId, projectId),
            eq(config.paymentProvider, provider),
            eq(config.active, true)
          ),
      })
      .catch((e) => {
        this.logger.error("error getting payment provider config", {
          error: e.message,
          customerId,
          projectId,
          provider,
        })

        throw e
      })

    if (!config) {
      return Err(
        new UnPriceCustomerError({
          code: "PAYMENT_PROVIDER_CONFIG_NOT_FOUND",
          message: "Payment provider config not found or not active",
        })
      )
    }

    const aesGCM = await AesGCM.withBase64Key(env.ENCRYPTION_KEY)

    const decryptedKey = await aesGCM.decrypt({
      iv: config.keyIv,
      ciphertext: config.key,
    })

    const paymentProviderService = new PaymentProviderService({
      customer: customerData,
      logger: this.logger,
      paymentProvider: provider,
      token: decryptedKey,
    })

    return Ok(paymentProviderService)
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

  private async getPaymentMethodsData({
    customerId,
    projectId,
    provider,
  }: {
    customerId: string
    projectId: string
    provider: PaymentProvider
  }): Promise<CustomerPaymentMethod[]> {
    const { val: paymentProviderService, err } = await this.getPaymentProvider({
      customerId,
      projectId,
      provider,
    })

    if (err) {
      return []
    }

    try {
      const customerId = paymentProviderService.getCustomerId()

      if (!customerId) {
        this.logger.info("payment provider customer ID not found", {
          customerId,
          projectId,
          provider,
        })
        return []
      }

      const { err, val } = await paymentProviderService.listPaymentMethods({
        limit: 5,
      })

      if (err) {
        this.logger.info("payment provider error", {
          customerId,
          projectId,
          provider,
          error: err.message,
        })
        return []
      }

      return val
    } catch (err) {
      const error = err as Error

      this.logger.error("payment provider error", {
        customerId,
        projectId,
        provider,
        error: error.message,
      })
      return []
    }
  }

  public async getPaymentMethods({
    customerId,
    provider,
    projectId,
    opts,
  }: {
    customerId: string
    provider: PaymentProvider
    projectId: string
    opts?: {
      skipCache?: boolean // skip cache to force revalidation
    }
  }): Promise<Result<CustomerPaymentMethod[], FetchError | UnPriceCustomerError>> {
    // first try to get the payment methods from cache, if not found try to get it from DO,
    const { val, err } = opts?.skipCache
      ? await wrapResult(
          this.getPaymentMethodsData({
            customerId,
            provider,
            projectId,
          }),
          (err) =>
            new FetchError({
              message: "unable to query payment methods from db",
              retry: false,
              context: {
                error: err.message,
                url: "",
                customerId: customerId,
                provider: provider,
                method: "getPaymentMethods",
              },
            })
        )
      : await retry(
          3,
          async () =>
            this.cache.customerPaymentMethods.swr(`${customerId}:${provider}`, () =>
              this.getPaymentMethodsData({
                customerId,
                provider,
                projectId,
              })
            ),
          (attempt, err) => {
            this.logger.warn("Failed to fetch payment methods data from cache, retrying...", {
              customerId: customerId,
              attempt,
              error: err.message,
            })
          }
        )

    if (err) {
      this.logger.error("error getting payment methods", {
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
      return Ok([])
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
      planSlug,
      sessionId,
      billingInterval,
      metadata,
    } = input

    // plan version clould be empty, in which case we have to guess the best plan for the customer
    // given the currency, the plan slug and the version
    let planVersion: (PlanVersion & { project: Project; plan: Plan }) | null = null
    let pageId: string | null = null

    if (sessionId) {
      // if session id is provided, we need to get the plan version from the session
      // get the session from analytics
      const data = await this.analytics.clickPlans({
        sessionId: sessionId,
      })

      const session = data.data.at(0)

      if (!session) {
        return Err(
          new UnPriceCustomerError({
            code: "PLAN_VERSION_NOT_FOUND",
            message: "Session not found",
          })
        )
      }

      pageId = session.pageId

      planVersion = await this.db.query.versions
        .findFirst({
          with: {
            project: true,
            plan: true,
          },
          where: (version, { eq, and }) =>
            and(eq(version.id, session.planVersionId), eq(version.projectId, projectId)),
        })
        .then((data) => data ?? null)
    } else if (planVersionId) {
      planVersion = await this.db.query.versions
        .findFirst({
          with: {
            project: true,
            plan: true,
          },
          where: (version, { eq, and }) =>
            and(
              eq(version.id, planVersionId),
              eq(version.projectId, projectId),
              // filter by currency if provided
              defaultCurrency ? eq(version.currency, defaultCurrency) : undefined
            ),
        })
        .then((data) => data ?? null)
    } else if (planSlug) {
      // find the plan version by the plan slug
      const plan = await this.db.query.plans
        .findFirst({
          with: {
            versions: {
              with: {
                project: true,
                plan: true,
              },
              where: (version, { eq, and }) =>
                and(
                  // filter by latest version
                  eq(version.latest, true),
                  // filter by project
                  eq(version.projectId, projectId),
                  // filter by currency if provided
                  defaultCurrency ? eq(version.currency, defaultCurrency) : undefined
                ),
            },
          },
          where: (plan, { eq, and }) => and(eq(plan.projectId, projectId), eq(plan.slug, planSlug)),
        })
        .then((data) => {
          if (!data) {
            return null
          }

          // filter by billing interval if provided
          if (billingInterval) {
            const versions = data.versions.filter(
              (version) => version.billingConfig.billingInterval === billingInterval
            )

            return {
              ...data,
              versions: versions ?? [],
            }
          }

          return data
        })

      if (!plan) {
        return Err(
          new UnPriceCustomerError({
            code: "PLAN_VERSION_NOT_FOUND",
            message: "Plan version not found",
          })
        )
      }

      planVersion = plan.versions[0] ?? null
    } else {
      // if no plan version is provided, we use the default plan
      const defaultPlan = await this.db.query.plans.findFirst({
        where: (plan, { eq, and }) =>
          and(eq(plan.projectId, projectId), eq(plan.defaultPlan, true)),
      })

      if (!defaultPlan) {
        return Err(
          new UnPriceCustomerError({
            code: "NO_DEFAULT_PLAN_FOUND",
            message: "Default plan not found, provide a plan version id, slug or session id",
          })
        )
      }

      planVersion = await this.db.query.versions
        .findFirst({
          with: {
            project: true,
            plan: true,
          },
          where: (version, { eq, and }) =>
            and(
              eq(version.planId, defaultPlan.id),
              eq(version.latest, true),
              eq(version.status, "published"),
              eq(version.active, true)
            ),
        })
        .then((data) => data ?? null)
    }

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
    const currency = defaultCurrency ?? planProject.defaultCurrency
    const defaultBillingInterval = billingInterval ?? planVersion.billingConfig.billingInterval

    if (
      defaultBillingInterval &&
      planVersion.billingConfig.billingInterval !== defaultBillingInterval
    ) {
      return Err(
        new UnPriceCustomerError({
          code: "BILLING_INTERVAL_MISMATCH",
          message: "Billing interval mismatch",
        })
      )
    }

    // validate the currency if provided
    if (currency !== planVersion.currency) {
      return Err(
        new UnPriceCustomerError({
          code: "CURRENCY_MISMATCH",
          message:
            "Currency mismatch, the project default currency does not match the plan version currency",
        })
      )
    }

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
            currency: currency,
            timezone: timezone || planProject.timezone,
            projectId: projectId,
            externalId: externalId,
            metadata: metadata,
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
          currency: currency,
          projectId: projectId,
        },
      })

      if (err) {
        return Err(
          new UnPriceCustomerError({
            code: "PAYMENT_PROVIDER_ERROR",
            message: err.message,
          })
        )
      }

      if (!val) {
        return Err(
          new UnPriceCustomerError({
            code: "PAYMENT_PROVIDER_ERROR",
            message: "Error creating payment provider signup",
          })
        )
      }

      // send event to analytics for tracking conversions
      this.waitUntil(
        this.analytics.ingestEvents({
          action: "sign_up",
          version: "1",
          session_id: sessionId ?? "",
          timestamp: new Date().toISOString(),
          payload: {
            customer_id: customerId,
            plan_version_id: planVersion.id,
            page_id: pageId,
            status: "payment_provider_signup",
          },
        })
      )

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
            defaultCurrency: currency,
            timezone: timezone ?? planProject.timezone,
            active: true,
            metadata: metadata,
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

        // create the phase
        const { err: createPhaseErr } = await subscriptionService.createPhase({
          input: {
            planVersionId: planVersion.id,
            startAt: Date.now(),
            config: config,
            paymentMethodRequired: planVersion.paymentMethodRequired,
            customerId: newCustomer.id,
            subscriptionId: newSubscription.id,
          },
          projectId: projectId,
          db: trx,
          now: Date.now(),
        })

        if (createPhaseErr) {
          trx.rollback()

          return Err(
            new UnPriceCustomerError({
              code: "PHASE_NOT_CREATED",
              message: "Error creating phase",
            })
          )
        }

        return { newCustomer, newSubscription }
      })

      // send event to analytics for tracking conversions
      this.waitUntil(
        this.analytics.ingestEvents({
          action: "sign_up",
          version: "1",
          session_id: sessionId ?? "",
          timestamp: new Date().toISOString(),
          payload: {
            customer_id: customerId,
            plan_version_id: planVersion.id,
            page_id: pageId,
            status: "direct_signup",
          },
        })
      )

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
