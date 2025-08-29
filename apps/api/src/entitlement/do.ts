import { type Connection, Server } from "partyserver"

import { type DrizzleSqliteDODatabase, drizzle } from "drizzle-orm/durable-sqlite"
import { migrate } from "drizzle-orm/durable-sqlite/migrator"
import migrations from "../../drizzle/migrations"

import { Analytics } from "@unprice/analytics"
import { count, sql } from "drizzle-orm"
import { usageRecords, verifications } from "~/db/schema"
import type { schema } from "~/db/types"
import type { Env } from "~/env"
import { unpriceDb } from "~/util/db"
import type { CanRequest, ReportUsageRequest, ReportUsageResponse } from "./interface"

import { env } from "cloudflare:workers"

import { UpstashRedisStore } from "@unkey/cache/stores"
import type { CustomerEntitlementExtended } from "@unprice/db/validators"
import { FetchError } from "@unprice/error"
import { Err, Ok, type Result } from "@unprice/error"
import { ConsoleLogger, type Logger } from "@unprice/logging"
import { CacheService, redis as upstashRedis } from "@unprice/services/cache"
import {
  CustomerService,
  type DenyReason,
  type UnPriceCustomerError,
} from "@unprice/services/customers"
import { LogdrainMetrics, type Metrics, NoopMetrics } from "@unprice/services/metrics"

interface UsageLimiterConfig {
  entitlements: CustomerEntitlementExtended[]
}

// This durable object takes care of handling the usage of every feature per customer.
// It is used to validate the usage of a feature and to report the usage to tinybird.
export class DurableObjectUsagelimiter extends Server {
  // if the do is initialized
  private initialized = false
  // once the durable object is initialized we can avoid
  // querying the db for usage on each request
  private featuresUsage: Map<string, CustomerEntitlementExtended> = new Map()
  // internal database of the do
  private db: DrizzleSqliteDODatabase<typeof schema>
  // tinybird analytics
  private analytics: Analytics
  // logger
  private logger: Logger
  // cache
  private cache: CacheService
  // metrics
  private metrics: Metrics
  // customer service
  private customerService: CustomerService
  // Default ttl for the usage records
  private readonly MS_TTL = 1000 * 30 // 30 secs
  // Debounce delay for the broadcast
  private lastBroadcastTime = 0
  // debounce delay for the broadcast
  private readonly DEBOUNCE_DELAY = 1000 * 1 // 1 second
  // update period for the entitlements
  private readonly UPDATE_PERIOD = 1000 * 60 * 5 // 5 mins

  // hibernate the do when no websocket nor connections are active
  static options = {
    hibernate: true,
  }

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)

    this.db = drizzle(ctx.storage, { logger: false })

    this.analytics = new Analytics({
      emit: env.EMIT_ANALYTICS.toString() === "true",
      tinybirdToken: env.TINYBIRD_TOKEN,
      tinybirdUrl: env.TINYBIRD_URL,
    })

    this.logger = new ConsoleLogger({
      requestId: this.ctx.id.toString(),
      service: "usagelimiter",
      environment: env.NODE_ENV,
      defaultFields: {
        durableObjectId: this.ctx.id.toString(),
      },
    })

    const emitMetrics = env.EMIT_METRICS_LOGS.toString() === "true"

    this.metrics = emitMetrics
      ? new LogdrainMetrics({
          requestId: this.ctx.id.toString(),
          environment: env.NODE_ENV,
          logger: this.logger,
          service: "usagelimiter",
        })
      : new NoopMetrics()

    this.cache = new CacheService(
      {
        waitUntil: this.ctx.waitUntil.bind(this.ctx),
      },
      this.metrics,
      emitMetrics
    )

    // redis seems to be faster than cloudflare
    const upstashCacheStore =
      env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
        ? new UpstashRedisStore({
            redis: upstashRedis,
          })
        : undefined

    // register the cloudflare store if it is configured
    this.cache.init(upstashCacheStore ? [upstashCacheStore] : [])

    const cache = this.cache.getCache()

    this.customerService = new CustomerService({
      logger: this.logger,
      analytics: this.analytics,
      waitUntil: this.ctx.waitUntil.bind(this.ctx),
      cache: cache,
      metrics: this.metrics,
      db: unpriceDb,
    })

    this.initialize()
  }

  async initialize() {
    // if already initialized, return
    if (this.initialized) {
      return
    }

    // block concurrency while initializing
    this.ctx.blockConcurrencyWhile(async () => {
      // all happen in a try catch to avoid crashing the do
      try {
        // migrate first
        await this._migrate()

        // save the config in the do storage
        const config = await this.getConfig()

        // get the entitlements from the db
        // we save the entitlements in the do to avoid querying the db for each request
        // then we update the entitlements every UPDATE_PERIOD
        const entitlements = config.entitlements

        // user can't have the same feature slug for different entitlements
        entitlements.forEach((e) => {
          this.featuresUsage.set(e.featureSlug, e)
        })

        this.initialized = true
      } catch (e) {
        this.logger.error("error initializing do", {
          error: e instanceof Error ? e.message : "unknown error",
        })

        this.featuresUsage.clear()
        this.initialized = false
        this.ctx.storage.delete("config")
      }
    })
  }

  private async getConfig(): Promise<UsageLimiterConfig> {
    if (!this.initialized) {
      // initialize if not initialized
      this.initialize()
    }

    const config = (await this.ctx.storage.get("config")) as UsageLimiterConfig

    // clean the config from undefined entitlements
    return {
      ...config,
      entitlements: config?.entitlements?.filter((e) => e?.id !== undefined) ?? [],
    }
  }

  private async updateConfig(config: UsageLimiterConfig) {
    if (!this.initialized) {
      // initialize if not initialized
      this.initialize()
    }

    const cleanConfig = {
      ...config,
      entitlements: config.entitlements.filter((e) => e?.id !== undefined),
    }

    await this.ctx.storage.put("config", cleanConfig)
  }

  private async updateEntitlement(entitlement: CustomerEntitlementExtended) {
    const config = await this.getConfig()
    const entitlements = config.entitlements.filter(
      (e) => e.featureSlug !== entitlement.featureSlug
    )
    entitlements.push({
      ...entitlement,
      lastUsageUpdateAt: Date.now(),
    })

    // update the config
    await this.updateConfig({ entitlements })

    // update the state
    this.ctx.blockConcurrencyWhile(async () => {
      this.featuresUsage.set(entitlement.featureSlug, entitlement)
    })
  }

  public async getEntitlements(): Promise<CustomerEntitlementExtended[]> {
    const config = await this.getConfig()
    return config.entitlements
  }

  // this is a simple way to control when to refresh the entitlements
  public async getEntitlement({
    customerId,
    projectId,
    featureSlug,
    now,
    opts,
  }: {
    customerId: string
    projectId: string
    featureSlug: string
    now: number
    opts?: {
      forceRefresh?: boolean
    }
  }): Promise<Result<CustomerEntitlementExtended, FetchError | UnPriceCustomerError>> {
    // get the config
    const config = await this.getConfig()
    // get the entitlement from the config
    const entitlement = config.entitlements.find((e) => e.featureSlug === featureSlug)
    // if the last update is more than UPDATE_PERIOD, refresh the entitlements
    const shouldRefresh = entitlement
      ? now - entitlement.lastUsageUpdateAt > this.UPDATE_PERIOD
      : true

    if (shouldRefresh || opts?.forceRefresh) {
      // get the entitlements from the db
      const { err, val } = await this.customerService.getActiveEntitlement(
        customerId,
        featureSlug,
        projectId,
        now,
        {
          skipCache: true, // skip cache to force revalidation
          withLastUsage: true, // we need the last usage to calculate the new usage
        }
      )

      if (err) {
        this.logger.error("error getting entitlement from do", {
          error: err.message,
        })
        return Err(err)
      }

      if (!val) {
        // if the entitlement is not found we want to keep a placeholder
        // so in future request don't spam the db
        const placeholderEntitlement = {
          id: "placeholder",
          featureSlug: featureSlug,
          lastUsageUpdateAt: now,
        } as CustomerEntitlementExtended

        await this.updateEntitlement(placeholderEntitlement)

        return Err(
          new FetchError({
            message: "entitlement not found",
            retry: false,
          })
        )
      }

      // update the config
      await this.updateEntitlement(val)

      // return the entitlement
      return Ok(val)
    }

    if (!entitlement?.id) {
      return Err(
        new FetchError({
          message: "entitlement not found",
          retry: false,
        })
      )
    }

    if (entitlement?.id === "placeholder") {
      return Err(
        new FetchError({
          message: `DO: Entitlement not found, entitlement will be refreshed in ${Math.round(
            (entitlement.lastUsageUpdateAt + this.UPDATE_PERIOD - Date.now()) / 1000
          )} seconds`,
          retry: false,
        })
      )
    }

    return Ok(entitlement)
  }

  async _migrate() {
    try {
      await migrate(this.db, migrations)
    } catch (error) {
      // Log the error
      this.logger.error("error migrating DO", {
        error: error instanceof Error ? error.message : "unknown error",
      })

      throw error
    }
  }

  // when connected through websocket we can broadcast events to the client
  // realtime events are used to debug events in unprice dashboard
  async broadcastEvents(data: {
    customerId: string
    featureSlug: string
    deniedReason?: DenyReason
    usage?: number
    limit?: number
    notifyUsage?: boolean
    type: "can" | "reportUsage"
    success: boolean
  }) {
    const now = Date.now()

    // Only broadcast if enough time has passed since last broadcast
    // defailt 1 per second
    // this is used to debug events in real time in unprice dashboard
    if (now - this.lastBroadcastTime >= this.DEBOUNCE_DELAY) {
      // under the hood this validates if there are connections
      // and sends the event to all of them
      this.broadcast(JSON.stringify(data))
      this.lastBroadcastTime = now
    }
  }

  private isValidEntitlement(
    entitlement: CustomerEntitlementExtended,
    opts: { allowOverage?: boolean }
  ): {
    valid: boolean
    message: string
    deniedReason?: DenyReason
    limit?: number
    usage?: number
  } {
    // check if all the DO is initialized
    if (!this.initialized) {
      return {
        valid: false,
        message: "DO not initialized",
      }
    }

    if (entitlement.project.enabled === false) {
      return {
        valid: false,
        message: "DO: Project is disabled",
        deniedReason: "PROJECT_DISABLED",
      }
    }

    if (entitlement.customer.active === false) {
      return {
        valid: false,
        message: "DO: Customer is disabled",
        deniedReason: "CUSTOMER_DISABLED",
      }
    }

    if (entitlement.subscription.active === false) {
      return {
        valid: false,
        message: "DO: Subscription is disabled",
        deniedReason: "SUBSCRIPTION_DISABLED",
      }
    }

    const now = Date.now()

    // check if the entitlement has expired with a buffer period in days
    // buffer period is used to avoid race conditions when the entitlement is updated
    // and the customer is still using the feature
    // this will generate overage of course, but it's better than not having it
    const validUntil = entitlement.validTo
      ? entitlement.validTo + entitlement.bufferPeriodDays * 24 * 60 * 60 * 1000
      : null

    if (validUntil && now > validUntil) {
      return {
        valid: false,
        message: "entitlement expired",
        deniedReason: "ENTITLEMENT_EXPIRED",
      }
    }

    // check if the entitlement has a limit and the usage is greater than the limit
    const checkLimitResult = this.checkLimit(entitlement, opts)

    if (!checkLimitResult.success) {
      return {
        valid: false,
        message: checkLimitResult.message,
        deniedReason: checkLimitResult.deniedReason,
        limit: Number(checkLimitResult.limit),
        usage: Number(checkLimitResult.usage),
      }
    }

    return {
      valid: true,
      message: "entitlement is valid",
    }
  }

  private async insertVerification(
    entitlement: {
      entitlementId: string
      customerId: string
      projectId: string
      featureSlug: string
      requestId: string
      metadata: string | null
      featurePlanVersionId: string
      subscriptionItemId: string | null
      subscriptionPhaseId: string | null
      subscriptionId: string | null
    },
    data: CanRequest,
    latency: number,
    deniedReason?: DenyReason
  ) {
    return this.db
      .insert(verifications)
      .values({
        entitlementId: entitlement.entitlementId,
        customerId: data.customerId,
        projectId: data.projectId,
        featureSlug: data.featureSlug,
        requestId: data.requestId,
        timestamp: data.timestamp,
        createdAt: Date.now(),
        latency: latency.toString() ?? "0",
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        deniedReason: deniedReason,
        featurePlanVersionId: entitlement.featurePlanVersionId,
        subscriptionItemId: entitlement.subscriptionItemId,
        subscriptionPhaseId: entitlement.subscriptionPhaseId,
        subscriptionId: entitlement.subscriptionId,
      })
      .returning()
      .catch((e) => {
        this.logger.error("error inserting verification", {
          error: e instanceof Error ? e.message : "unknown error",
        })
        return null
      })
      .then((result) => {
        return result?.[0] ?? null
      })
  }

  public async can(data: CanRequest): Promise<{
    success: boolean
    message: string
    deniedReason?: DenyReason
    limit?: number
    usage?: number
  }> {
    // first initialize the do
    this.initialize()

    // get the entitlement
    const { err, val: entitlement } = await this.getEntitlement({
      customerId: data.customerId,
      projectId: data.projectId,
      featureSlug: data.featureSlug,
      now: data.timestamp,
    })

    if (err) {
      return {
        success: false,
        message: err.message,
        deniedReason: "ENTITLEMENT_NOT_FOUND",
      }
    }

    // first get the entitlement
    const { valid, message, deniedReason, limit, usage } = this.isValidEntitlement(entitlement, {
      allowOverage: false, // for verification we don't allow overage
    })

    // ensure the alarm is set so we can send usage to tinybird periodically
    await this.ensureAlarmIsSet(data.secondsToLive)

    // insert verification this is zero latency
    const verification = await this.insertVerification(
      {
        entitlementId: entitlement.id,
        customerId: data.customerId,
        projectId: data.projectId,
        featureSlug: data.featureSlug,
        requestId: data.requestId,
        metadata: JSON.stringify(data.metadata),
        featurePlanVersionId: entitlement.featurePlanVersionId,
        subscriptionItemId: entitlement.subscriptionItemId,
        subscriptionPhaseId: entitlement.subscriptionPhaseId,
        subscriptionId: entitlement.subscriptionId,
      },
      data,
      performance.now() - data.performanceStart,
      deniedReason
    )

    if (!verification?.id) {
      return {
        success: false,
        message: "error inserting verification from do, please try again later",
        deniedReason: "ERROR_INSERTING_VERIFICATION_DO",
      }
    }

    return {
      success: valid,
      message: message,
      deniedReason: deniedReason,
      limit: Number(limit),
      usage: Number(usage),
    }
  }

  private checkLimit(
    entitlement: CustomerEntitlementExtended,
    opts: { allowOverage?: boolean }
  ): {
    success: boolean
    message: string
    limit?: number
    usage?: number
    deniedReason?: DenyReason
  } {
    switch (entitlement.featureType) {
      case "flat":
        return { success: true, message: "flat feature is not applicable for usage limit" }
      case "tier":
      case "package":
      case "usage": {
        const { usage, limit } = entitlement
        const hitLimit = limit ? Number(usage) > Number(limit) : false

        if (hitLimit) {
          if (opts.allowOverage) {
            return {
              success: true,
              message: "limit exceeded, but overage is allowed",
              limit: Number(limit),
              usage: Number(usage),
            }
          }

          return {
            success: false,
            message: "limit exceeded",
            deniedReason: "LIMIT_EXCEEDED",
            limit: Number(limit),
            usage: Number(usage),
          }
        }

        return { success: true, message: "can", limit: Number(limit), usage: Number(usage) }
      }
    }
  }

  public async reportUsage(data: ReportUsageRequest): Promise<ReportUsageResponse> {
    // first initialize the do
    this.initialize()

    // first get the entitlement
    const { err, val: entitlement } = await this.getEntitlement({
      customerId: data.customerId,
      projectId: data.projectId,
      featureSlug: data.featureSlug,
      now: data.timestamp,
    })

    if (err) {
      return {
        success: false,
        message: err.message,
        deniedReason: "ENTITLEMENT_NOT_FOUND",
      }
    }

    const { valid, message, deniedReason } = this.isValidEntitlement(entitlement, {
      allowOverage: true, // for reporting usage we allow overage
    })

    // if the entitlement is not valid, we return an error
    // why? because we don't want to report usage for invalid entitlements, simply
    // as for verification we want to report the verification event even if the entitlement is invalid
    if (!valid) {
      return {
        success: false,
        message: message,
        deniedReason: deniedReason,
      }
    }

    // if the use is negative but the entitlement aggregationMethod is not in sum or sum_all
    // we need to return an error
    if (Number(data.usage) < 0 && !["sum", "sum_all"].includes(entitlement.aggregationMethod)) {
      return {
        success: false,
        message: `Usage cannot be negative when the feature type is not sum or sum_all, got ${entitlement.aggregationMethod}. This will disturb aggregations.`,
        deniedReason: "INCORRECT_USAGE_REPORTING",
      }
    }

    // ensure the alarm is set so we can send usage to tinybird periodically
    await this.ensureAlarmIsSet(data.secondsToLive)

    // insert usage into db
    const usageRecord = await this.db
      .insert(usageRecords)
      .values({
        customerId: data.customerId,
        featureSlug: data.featureSlug,
        usage: entitlement.featureType === "flat" ? "0" : data.usage.toString(),
        timestamp: data.timestamp,
        idempotenceKey: data.idempotenceKey,
        requestId: data.requestId,
        projectId: data.projectId,
        featurePlanVersionId: entitlement.featurePlanVersionId,
        entitlementId: entitlement.id,
        subscriptionItemId: entitlement.subscriptionItemId,
        subscriptionPhaseId: entitlement.subscriptionPhaseId,
        subscriptionId: entitlement.subscriptionId,
        createdAt: Date.now(),
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      })
      .returning()
      .catch((e) => {
        this.logger.error("error inserting usage from do", {
          error: e.message,
        })

        throw e
      })
      .then((result) => {
        return result?.[0] ?? null
      })

    if (!usageRecord?.id) {
      return {
        success: false,
        message: "error inserting usage from do, please try again later",
        deniedReason: "ERROR_INSERTING_USAGE_DO",
      }
    }

    // after validating, we set the usage and agregate it to the DO state for the next request.
    // keep in mind that database calls are 0 latency because of the Durable Object
    // we keep the agregated state in a map to avoid having to query the db for each request
    const result = await this.setUsage(entitlement, data.usage)

    return {
      success: result.success,
      message: result.message,
      notifyUsage: result.notifyUsage,
      usage: result.usage,
      limit: result.limit,
    }
  }

  // instead of creating a cron job alarm we set and alarm on every request
  private async ensureAlarmIsSet(secondsToLive?: number): Promise<void> {
    // we set alarms to send usage to tinybird periodically
    // this would avoid having too many events in the db as well
    const alarm = await this.ctx.storage.getAlarm()
    const now = Date.now()

    // there is a default ttl for the usage records
    // alternatively we can use the secondsToLive from the request
    // this can be usefull if we want to support realtime usage reporting for some clients
    const nextAlarm = secondsToLive ? now + secondsToLive * 1000 : now + this.MS_TTL

    // if there is no alarm set one given the ttl
    if (!alarm) {
      this.ctx.storage.setAlarm(nextAlarm)
    } else if (alarm < now) {
      // delete the alarm if it is in the past
      // and set it again
      this.ctx.storage.deleteAlarm()
      this.ctx.storage.setAlarm(nextAlarm)
    }
  }

  private calculateNewUsage(entitlement: CustomerEntitlementExtended, usage: number) {
    const aggregation = entitlement.aggregationMethod
    const currentUsage = Number(entitlement.usage)
    const accumulatedUsage = Number(entitlement.accumulatedUsage)

    switch (aggregation) {
      case "sum":
        return currentUsage + usage
      case "max":
        return Math.max(currentUsage, usage)
      case "last_during_period":
        return usage
      case "count":
        return currentUsage + 1
      case "count_all":
        return accumulatedUsage + 1
      case "max_all":
        return Math.max(accumulatedUsage, usage)
      case "sum_all":
        return accumulatedUsage + usage
      default:
        return usage
    }
  }

  private async setUsage(
    entitlement: CustomerEntitlementExtended,
    usage: number
  ): Promise<{
    success: boolean
    message: string
    notifyUsage?: boolean
    usage?: number
    limit?: number
  }> {
    const threshold = 90 // notify when the usage is 90% or more
    const limit = entitlement.limit ? Number(entitlement.limit) : undefined

    let message = ""
    let notifyUsage = false

    // check flat features
    if (entitlement.featureType === "flat") {
      return {
        success: false,
        message:
          "feature is flat, limit is not applicable, but events are billed. Please don't report usage for flat features to avoid overbilling.",
        usage: 0,
        limit: 1,
      }
    }

    const newUsage = this.calculateNewUsage(entitlement, usage)

    // check limit
    if (limit) {
      const usagePercentage = (newUsage / limit) * 100

      if (newUsage >= limit) {
        // Usage has reached or exceeded the limit
        message = `Your feature ${entitlement.featureSlug} has reached or exceeded its usage limit of ${limit}. Current usage: ${newUsage.toFixed(
          2
        )}% of its usage limit. This is over the limit by ${newUsage - limit}`
        notifyUsage = true
      } else if (usagePercentage >= threshold) {
        // Usage is at or above the threshold
        message = `Your feature ${entitlement.featureSlug} is at ${usagePercentage.toFixed(
          2
        )}% of its usage limit`
        notifyUsage = true
      }
    }

    // update the featuresUsage map with block concurrency
    this.ctx.blockConcurrencyWhile(async () => {
      this.featuresUsage.set(entitlement.featureSlug, {
        ...entitlement,
        usage: newUsage.toString(),
      })
    })

    // reset everything in the config from the map which is the source of truth
    await this.updateConfig({
      entitlements: Array.from(this.featuresUsage.values()),
    })

    return { success: true, message, notifyUsage, usage: newUsage, limit }
  }

  onStart(): void | Promise<void> {
    console.info("onStart")
  }

  onConnect(): void | Promise<void> {
    console.info("onConnect")
  }

  private async sendVerificationsToTinybird() {
    // Process events in batches to avoid memory issues
    const BATCH_SIZE = 500
    let processedCount = 0
    let lastProcessedId = 0

    while (true) {
      // Get a batch of events
      const verificationEvents = await this.db
        .select()
        .from(verifications)
        .where(lastProcessedId > 0 ? sql`id > ${lastProcessedId}` : undefined)
        .limit(BATCH_SIZE)
        .orderBy(verifications.id)

      if (verificationEvents.length === 0) break

      const firstId = verificationEvents[0]?.id
      const lastId = verificationEvents[verificationEvents.length - 1]?.id

      if (firstId && lastId) {
        try {
          const transformedEvents = verificationEvents.map((event) => ({
            featureSlug: event.featureSlug,
            entitlementId: event.entitlementId,
            customerId: event.customerId,
            projectId: event.projectId,
            subscriptionId: event.subscriptionId,
            subscriptionPhaseId: event.subscriptionPhaseId,
            subscriptionItemId: event.subscriptionItemId,
            timestamp: event.timestamp,
            status: event.deniedReason,
            metadata: event.metadata ? JSON.parse(event.metadata) : {},
            latency: event.latency ? Number(event.latency) : 0,
            requestId: event.requestId,
            featurePlanVersionId: event.featurePlanVersionId,
            success: event.success === 1,
          }))

          await this.analytics
            .ingestFeaturesVerification(transformedEvents)
            .catch((e) => {
              this.logger.error(`Failed in ingestFeaturesVerification from do ${e.message}`, {
                error: JSON.stringify(e),
                customerId: transformedEvents[0]?.customerId,
                projectId: transformedEvents[0]?.projectId,
              })
              throw e
            })
            .then(async (data) => {
              const rows = data?.successful_rows ?? 0
              const quarantined = data?.quarantined_rows ?? 0
              const total = rows + quarantined

              if (quarantined > 0) {
                this.logger.warn("quarantined verifications", {
                  quarantined,
                })
              }

              if (total >= verificationEvents.length) {
                // Delete by range - much more efficient, only 2 SQL variables
                const deletedResult = await this.db
                  .delete(verifications)
                  .where(sql`id >= ${firstId} AND id <= ${lastId}`)
                  .returning({ id: verifications.id })

                const deletedCount = deletedResult.length
                processedCount += deletedCount

                this.logger.info(
                  `deleted ${deletedCount} verifications from do ${this.ctx.id.toString()} (range: ${firstId}-${lastId})`,
                  {
                    rows: total,
                    deletedCount,
                    expectedCount: verificationEvents.length,
                  }
                )

                this.logger.info(
                  `Processed ${processedCount} verifications in this batch from do ${this.ctx.id.toString()}`,
                  {
                    customerId: transformedEvents[0]?.customerId,
                    projectId: transformedEvents[0]?.projectId,
                  }
                )
              } else {
                this.logger.info(
                  "the total of verifications sent to tinybird are not the same as the total of verifications in the db",
                  {
                    total,
                    expected: verificationEvents.length,
                    customerId: transformedEvents[0]?.customerId,
                    projectId: transformedEvents[0]?.projectId,
                  }
                )
              }
            })
        } catch (error) {
          this.logger.error(
            `Failed to send verifications to Tinybird from do ${this.ctx.id.toString()} ${error instanceof Error ? error.message : "unknown error"}`,
            {
              error: error instanceof Error ? JSON.stringify(error) : "unknown error",
              customerId: verificationEvents[0]?.customerId,
              projectId: verificationEvents[0]?.projectId,
            }
          )
          break
        }
      }

      // Update the last processed ID for the next batch
      lastProcessedId = lastId ?? lastProcessedId
    }
  }

  private async sendUsageToTinybird() {
    // Process events in batches to avoid memory issues
    const BATCH_SIZE = 500
    let processedCount = 0
    let lastProcessedId = 0

    while (true) {
      // Get a batch of events
      const events = await this.db
        .select()
        .from(usageRecords)
        .where(lastProcessedId > 0 ? sql`id > ${lastProcessedId}` : undefined)
        .limit(BATCH_SIZE)
        .orderBy(usageRecords.id)

      if (events.length === 0) break

      const firstId = events[0]?.id
      const lastId = events[events.length - 1]?.id

      // Create a Map to deduplicate events based on their unique identifiers
      const uniqueEvents = new Map()
      for (const event of events) {
        // in dev we use the idempotence key and timestamp to deduplicate so we can test the usage
        const key =
          env.NODE_ENV === "production"
            ? `${event.idempotenceKey}`
            : `${event.idempotenceKey}-${event.timestamp}`

        if (!uniqueEvents.has(key)) {
          uniqueEvents.set(key, {
            ...event,
            metadata: event.metadata ? JSON.parse(event.metadata) : {},
          })
        }
      }

      const deduplicatedEvents = Array.from(uniqueEvents.values())

      if (deduplicatedEvents.length > 0 && firstId && lastId) {
        try {
          await this.analytics
            .ingestFeaturesUsage(deduplicatedEvents)
            .catch((e) => {
              this.logger.error(
                `Failed to send ${deduplicatedEvents.length} events to Tinybird from do ${this.ctx.id.toString()}:`,
                {
                  error: e.message,
                  customerId: deduplicatedEvents[0]?.customerId,
                  projectId: deduplicatedEvents[0]?.projectId,
                }
              )
              throw e
            })
            .then(async (data) => {
              const rows = data?.successful_rows ?? 0
              const quarantined = data?.quarantined_rows ?? 0
              const total = rows + quarantined

              if (total >= deduplicatedEvents.length) {
                this.logger.info(
                  `successfully sent ${deduplicatedEvents.length} usage records to Tinybird`,
                  {
                    rows: total,
                  }
                )

                // Delete by range - much more efficient, only 2 SQL variables
                const deletedResult = await this.db
                  .delete(usageRecords)
                  .where(sql`id >= ${firstId} AND id <= ${lastId}`)
                  .returning({ id: usageRecords.id })

                const deletedCount = deletedResult.length
                processedCount += deletedCount

                this.logger.info(
                  `deleted ${deletedCount} usage records from do ${this.ctx.id.toString()} (range: ${firstId}-${lastId})`,
                  {
                    originalCount: events.length,
                    deduplicatedCount: deduplicatedEvents.length,
                    deletedCount,
                  }
                )
              } else {
                this.logger.info(
                  "the total of usage records sent to tinybird are not the same as the total of usage records in the db",
                  {
                    total,
                    expected: deduplicatedEvents.length,
                    customerId: deduplicatedEvents[0]?.customerId,
                    projectId: deduplicatedEvents[0]?.projectId,
                  }
                )
              }

              this.logger.info(
                `Processed ${processedCount} usage events in this batch from do ${this.ctx.id.toString()}`,
                {
                  customerId: deduplicatedEvents[0]?.customerId,
                  projectId: deduplicatedEvents[0]?.projectId,
                }
              )
            })
        } catch (error) {
          this.logger.error(
            `Failed to send events to Tinybird from do ${this.ctx.id.toString()}:`,
            {
              error: error instanceof Error ? error.message : "unknown error",
              customerId: deduplicatedEvents[0]?.customerId,
              projectId: deduplicatedEvents[0]?.projectId,
            }
          )
          break
        }
      }

      // Update the last processed ID for the next batch
      lastProcessedId = lastId ?? lastProcessedId
    }
  }

  // websocket message handler
  async onMessage(_conn: Connection, message: string) {
    console.info("onMessage", message)
  }

  async onAlarm(): Promise<void> {
    // send usage to tinybird on alarm
    await this.sendUsageToTinybird()
    // send verifications to tinybird on alarm
    await this.sendVerificationsToTinybird()
  }

  // resetDO the do used when the customer is signed out
  public async resetDO(): Promise<{
    success: boolean
    message: string
    slugs?: string[]
  }> {
    // initialize the do
    this.initialize()

    // send the current usage and verifications to tinybird
    await this.sendUsageToTinybird()
    await this.sendVerificationsToTinybird()

    let slugs: string[] = []

    // we are setting the state so better do it inside a block concurrency
    return this.ctx.blockConcurrencyWhile(async () => {
      // check if the are events in the db this should be 0 latency
      const events = await this.db
        .select({
          count: count(),
        })
        .from(usageRecords)
        .then((e) => e[0])

      const verification_events = await this.db
        .select({
          count: count(),
        })
        .from(verifications)
        .then((e) => e[0])

      // if there are no events, delete the do
      if (events?.count === 0 && verification_events?.count === 0) {
        // get the entitlements from the db
        const entitlements = await this.getEntitlements()
        // get the slugs from the entitlements
        slugs = entitlements.map((e) => e.featureSlug)

        await this.ctx.storage.deleteAll()
        this.initialized = false
      } else {
        return {
          success: false,
          message: `DO has ${events?.count} events and ${verification_events?.count} verification events, can't delete.`,
        }
      }

      return {
        success: true,
        message: "DO deleted",
        slugs,
      }
    })
  }
}
