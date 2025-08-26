import { type Connection, Server } from "partyserver"

import { type DrizzleSqliteDODatabase, drizzle } from "drizzle-orm/durable-sqlite"
import { migrate } from "drizzle-orm/durable-sqlite/migrator"
import migrations from "../../drizzle/migrations"

import { Analytics } from "@unprice/analytics"
import { count, eq, lte, sql } from "drizzle-orm"
import { entitlements, usageRecords, verifications } from "~/db/schema"
import type { Entitlement, NewEntitlement, schema } from "~/db/types"
import type { Env } from "~/env"
import type { CanRequest, ReportUsageRequest, ReportUsageResponse } from "./interface"

import { env } from "cloudflare:workers"
import { ConsoleLogger, type Logger } from "@unprice/logging"
import type { DenyReason } from "@unprice/services/customers"

// This durable object takes care of handling the usage of every feature per customer.
// It is used to validate the usage of a feature and to report the usage to tinybird.
export class DurableObjectUsagelimiter extends Server {
  private initialized = false
  // once the durable object is initialized we can avoid
  // querying the db for usage on each request
  private featuresUsage: Map<string, Entitlement> = new Map()
  // internal database of the do
  private db: DrizzleSqliteDODatabase<typeof schema>
  // tinybird analytics
  private analytics: Analytics
  // logger
  private logger: Logger
  // Default ttl for the usage records
  private readonly MS_TTL = 1000 * 30 // 30 secs
  // Debounce delay for the broadcast
  private lastBroadcastTime = 0
  // debounce delay for the broadcast
  private readonly DEBOUNCE_DELAY = 1000 * 1 // 1 second

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
    })

    this.initialize()
  }

  async initialize() {
    // block concurrency while initializing
    this.ctx.blockConcurrencyWhile(async () => {
      // all happen in a try catch to avoid crashing the do
      try {
        // migrate first
        await this._migrate()

        this.initialized = true

        const now = Date.now()

        // get the usage for the customer for every feature
        const entitlementsDO = await this.db
          .select()
          .from(entitlements)
          .where(lte(entitlements.validFrom, now))
          .catch((e) => {
            this.logger.error("error getting entitlements from do", {
              error: e.message,
            })

            return []
          })

        // entitlement are revalidated on each request when needed
        if (entitlementsDO.length === 0) return

        // user can't have the same feature slug for different entitlements
        entitlementsDO.forEach((e) => {
          this.featuresUsage.set(e.featureSlug, e)
        })
      } catch (e) {
        this.logger.error("error initializing do", {
          error: e instanceof Error ? e.message : "unknown error",
        })

        this.featuresUsage.clear()
        this.initialized = false
      }
    })
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

  private isInitialized() {
    if (!this.initialized) {
      return {
        valid: false,
        message: "DO not initialized",
      }
    }

    return { valid: true, message: "DO initialized" }
  }

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

  private isValidEntitlement(featureSlug: string): {
    valid: boolean
    message: string
    entitlement?: Entitlement
    deniedReason?: DenyReason
  } {
    const { valid, message } = this.isInitialized()

    if (!valid) {
      return { valid, message }
    }

    const entitlement = this.featuresUsage.get(featureSlug)

    if (!entitlement) {
      return {
        valid: false,
        message: "DO: Entitlement not found for this customer",
        deniedReason: "ENTITLEMENT_NOT_FOUND",
      }
    }

    const now = Date.now()
    // check if the entitlement has expired
    const validUntil = entitlement.validTo
      ? entitlement.validTo + entitlement.bufferPeriodDays * 24 * 60 * 60 * 1000
      : null

    if (validUntil && now > validUntil) {
      return {
        valid: false,
        message: "entitlement expired",
        deniedReason: "ENTITLEMENT_EXPIRED",
        entitlement,
      }
    }

    // TODO: should we check the limit here? or allow overage?
    // if (entitlement.limit && Number(entitlement.usage) > Number(entitlement.limit)) {
    //   return {
    //     valid: false,
    //     message: "entitlement limit exceeded",
    //     deniedReason: "LIMIT_EXCEEDED",
    //     entitlement,
    //   }
    // }

    return {
      valid: true,
      message: "entitlement is valid",
      entitlement,
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

  async can(data: CanRequest): Promise<{
    success: boolean
    message: string
    deniedReason?: DenyReason
  }> {
    // first get the entitlement
    const { valid, message, entitlement, deniedReason } = this.isValidEntitlement(data.featureSlug)

    if (!entitlement) {
      return {
        success: false,
        message: "DO: Entitlement not found for this customer",
        deniedReason: "ENTITLEMENT_NOT_FOUND",
      }
    }

    await this.ensureAlarmIsSet(data.secondsToLive)

    const performanceStart = data.performanceStart ?? 0

    if (!valid) {
      // insert async verification
      this.ctx.waitUntil(
        Promise.all([
          // broadcast the event to the project notify about the denied reason
          this.broadcastEvents({
            customerId: data.customerId,
            featureSlug: data.featureSlug,
            type: "can",
            success: valid,
            deniedReason: deniedReason,
          }),
          // insert verification
          this.insertVerification(
            {
              entitlementId: entitlement.entitlementId,
              customerId: data.customerId,
              projectId: data.projectId,
              featureSlug: data.featureSlug,
              requestId: data.requestId,
              metadata: data.metadata ? JSON.stringify(data.metadata) : null,
              featurePlanVersionId: entitlement.featurePlanVersionId,
              subscriptionItemId: entitlement.subscriptionItemId,
              subscriptionPhaseId: entitlement.subscriptionPhaseId,
              subscriptionId: entitlement.subscriptionId,
            },
            data,
            performance.now() - performanceStart,
            deniedReason
          ),
        ])
      )

      return {
        success: false,
        message: message,
        deniedReason: deniedReason,
      }
    }

    if (!valid) {
      // insert async verification and broadcast the event
      this.ctx.waitUntil(
        Promise.all([
          // broadcast the event
          this.broadcastEvents({
            featureSlug: data.featureSlug,
            customerId: data.customerId,
            type: "can",
            success: valid,
            deniedReason: deniedReason,
          }),
          // insert verification
          this.insertVerification(
            {
              entitlementId: entitlement.entitlementId,
              customerId: data.customerId,
              projectId: data.projectId,
              featureSlug: data.featureSlug,
              requestId: data.requestId,
              metadata: data.metadata ? JSON.stringify(data.metadata) : null,
              featurePlanVersionId: entitlement.featurePlanVersionId,
              subscriptionItemId: entitlement.subscriptionItemId,
              subscriptionPhaseId: entitlement.subscriptionPhaseId,
              subscriptionId: entitlement.subscriptionId,
            },
            data,
            performance.now() - performanceStart,
            deniedReason
          ),
        ])
      )

      return {
        success: false,
        message,
        deniedReason,
      }
    }

    // at this point we basically validate the user has access to the feature
    const result = this.checkLimit(entitlement)

    // insert verification
    this.ctx.waitUntil(
      Promise.all([
        // insert verification
        this.insertVerification(
          {
            entitlementId: entitlement.entitlementId,
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
          performance.now() - performanceStart,
          result.deniedReason
        ),
      ])
    )

    return {
      success: result.success,
      message: result.message,
      deniedReason: result.deniedReason,
    }
  }

  private checkLimit(entitlement: Entitlement): {
    success: boolean
    message: string
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
          return { success: false, message: "limit exceeded", deniedReason: "LIMIT_EXCEEDED" }
        }

        return { success: true, message: "can" }
      }
    }
  }

  async reportUsage(data: ReportUsageRequest): Promise<ReportUsageResponse> {
    // first get the entitlement
    const { valid, message, entitlement } = this.isValidEntitlement(data.featureSlug)

    if (!entitlement) {
      return {
        success: false,
        message: "ENTITLEMENT_NOT_FOUND",
      }
    }

    // TODO: send analytics event??
    if (!valid) {
      return {
        success: false,
        message,
      }
    }

    // TODO: send analytics event??
    // if the use is negative but the entitlement aggregationMethod is not in sum or sum_all
    // we need to return an error
    if (
      Number(entitlement.usage) < 0 &&
      !["sum", "sum_all"].includes(entitlement.aggregationMethod)
    ) {
      return {
        success: false,
        message: `Usage cannot be negative when the feature type is not sum or sum_all, got ${entitlement.aggregationMethod}. This will disturb aggregations.`,
      }
    }

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
        entitlementId: entitlement.entitlementId,
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

    // TODO: send analytics event??
    if (!usageRecord) {
      return {
        success: false,
        message: "error inserting usage from do, please try again later",
      }
    }

    const result = await this.setUsage(entitlement, data.usage)

    // return usage
    return result
  }

  private async ensureAlarmIsSet(secondsToLive?: number): Promise<void> {
    // we set alarms to send usage to tinybird periodically
    // this would avoid having too many events in the db as well
    const alarm = await this.ctx.storage.getAlarm()
    const now = Date.now()

    // there is a default ttl for the usage records
    // alternatively we can use the secondsToLive from the request
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

  private calculateNewUsage(entitlement: Entitlement, usage: number) {
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
    entitlement: Entitlement,
    usage: number
  ): Promise<{
    success: boolean
    message: string
    notifyUsage?: boolean
    usage?: number
    limit?: number
  }> {
    const threshold = 80 // notify when the usage is 80% or more
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

    this.featuresUsage.set(entitlement.featureSlug, {
      ...entitlement,
      usage: newUsage.toString(),
    })

    // update the entitlement in the db
    const updatedEntitlement = await this.db
      .update(entitlements)
      .set({
        usage: newUsage.toString(),
        lastUsageUpdateAt: Date.now(),
      })
      .where(eq(entitlements.id, entitlement.id))
      .returning()
      .catch((e) => {
        this.logger.error("error updating entitlement", {
          error: e.message,
        })

        return null
      })
      .then((result) => {
        return result?.[0] ?? null
      })

    if (!updatedEntitlement) {
      return {
        success: false,
        message: "error updating entitlement",
      }
    }

    return { success: true, message, notifyUsage, usage: newUsage, limit }
  }

  onStart(): void | Promise<void> {
    console.info("onStart")
  }

  onConnect(): void | Promise<void> {
    console.info("onConnect")
  }

  async sendVerificationsToTinybird() {
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
          }))

          await this.analytics
            .ingestFeaturesVerification(transformedEvents)
            .catch((e) => {
              this.logger.error(`Failed in ingestFeaturesVerification from do ${e.message}`, {
                error: JSON.stringify(e),
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
                  `Processed ${processedCount} verifications in this batch from do ${this.ctx.id.toString()}`
                )
              } else {
                this.logger.info(
                  "the total of verifications sent to tinybird are not the same as the total of verifications in the db",
                  {
                    total,
                    expected: verificationEvents.length,
                  }
                )
              }
            })
        } catch (error) {
          this.logger.error(
            `Failed to send verifications to Tinybird from do ${this.ctx.id.toString()} ${error instanceof Error ? error.message : "unknown error"}`,
            {
              error: error instanceof Error ? JSON.stringify(error) : "unknown error",
            }
          )
          break
        }
      }

      // Update the last processed ID for the next batch
      lastProcessedId = lastId ?? lastProcessedId
    }
  }

  async sendUsageToTinybird() {
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
                  }
                )
              }

              this.logger.info(
                `Processed ${processedCount} usage events in this batch from do ${this.ctx.id.toString()}`
              )
            })
        } catch (error) {
          this.logger.error(
            `Failed to send events to Tinybird from do ${this.ctx.id.toString()}:`,
            {
              error: error instanceof Error ? error.message : "unknown error",
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
  async resetDO(): Promise<{
    success: boolean
    message: string
    slugs?: string[]
  }> {
    if (!this.initialized) {
      return {
        success: false,
        message: "DO not initialized",
      }
    }

    return this.ctx.blockConcurrencyWhile(async () => {
      // send the current usage and verifications to tinybird
      await this.sendUsageToTinybird()
      await this.sendVerificationsToTinybird()

      // check if the are events in the db
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

      const slugs = await this.db
        .select({
          featureSlug: entitlements.featureSlug,
        })
        .from(entitlements)

      // if there are no events, delete the do
      if (events?.count === 0 && verification_events?.count === 0) {
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
        slugs: slugs.map((e) => e.featureSlug),
      }
    })
  }

  async getEntitlement(featureSlug: string): Promise<Entitlement | null> {
    if (!this.initialized) {
      this.initialize()
    }

    // get entitlement from db
    const entitlement = await this.db
      .select()
      .from(entitlements)
      .where(eq(entitlements.featureSlug, featureSlug))
      .then((e) => e?.[0] ?? null)

    if (!entitlement) {
      return null
    }

    return entitlement
  }

  async setEntitlement(entitlement: NewEntitlement) {
    if (!this.initialized) {
      this.initialize()
    }

    this.ctx.blockConcurrencyWhile(async () => {
      try {
        // find the entitlement by entitlementId
        const existingEntitlement = await this.db
          .select()
          .from(entitlements)
          .where(eq(entitlements.entitlementId, entitlement.entitlementId))
          .then((e) => e?.[0] ?? null)

        if (existingEntitlement) {
          // update the entitlement
          const result = await this.db
            .update(entitlements)
            .set(entitlement)
            .where(eq(entitlements.id, existingEntitlement.id))
            .returning()
            .catch((e) => {
              this.logger.error("error setting entitlement from do", {
                error: e.message,
              })

              return null
            })
            .then((e) => e?.[0] ?? null)

          if (!result) {
            return
          }

          this.featuresUsage.set(entitlement.featureSlug, result)
        } else {
          const result = await this.db
            .insert(entitlements)
            .values(entitlement)
            .returning()
            .catch((e) => {
              this.logger.error("error setting entitlement from do", {
                error: e.message,
              })

              return null
            })
            .then((e) => e?.[0] ?? null)

          if (!result) {
            return
          }

          this.featuresUsage.set(entitlement.featureSlug, result)
        }
      } catch (error) {
        this.logger.error("error setting entitlement from do", {
          error: error instanceof Error ? error.message : "unknown error",
        })
      }
    })
  }

  async getEntitlements(): Promise<Entitlement[]> {
    if (!this.initialized) {
      this.initialize()
    }

    return this.ctx.blockConcurrencyWhile(async () => {
      return this.db.select().from(entitlements)
    })
  }
}
