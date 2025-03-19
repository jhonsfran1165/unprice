import { type Connection, Server } from "partyserver"

import { type DrizzleSqliteDODatabase, drizzle } from "drizzle-orm/durable-sqlite"
import { migrate } from "drizzle-orm/durable-sqlite/migrator"
import migrations from "../../drizzle/migrations"

import type { Env } from "~/env"
import type { ReportUsageRequest, ReportUsageResponse } from "./interface"

import { type Database, and, eq as eqDb } from "@unprice/db"
import { customerEntitlements } from "@unprice/db/schema"
import type { AggregationMethod, FeatureType } from "@unprice/db/validators"
import type { CustomerEntitlement } from "@unprice/db/validators"
import { Analytics } from "@unprice/tinybird"
import { eq, inArray, sql } from "drizzle-orm"
import { entitlements, type schema, usageRecords } from "~/db/schema"
import { createDb } from "~/util/db"

export class DurableObjectUsagelimiter extends Server {
  private lastBroadcastTime = 0
  // once the durable object is initialized we can avoid
  // querying the db for usage on each request
  private featuresUsage: Map<
    string,
    {
      usage: number
      limit: number
      featureType: FeatureType
      aggregationMethod: AggregationMethod
      accumulatedUsage: number
    }
  > = new Map()

  private db: DrizzleSqliteDODatabase<typeof schema>
  private unpriceDb: Database
  private analytics: Analytics
  private readonly TTL = 1000 * 60 // 60 secs
  private readonly DEBOUNCE_DELAY = 1000 // Minimum time between broadcasts

  static options = {
    hibernate: true, // hibernate the do when idle
  }

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)

    this.db = drizzle(ctx.storage, { logger: false })
    this.analytics = new Analytics({
      emit: env.EMIT_METRICS_LOGS,
      tinybirdToken: env.TINYBIRD_TOKEN,
      tinybirdUrl: env.TINYBIRD_URL,
    })

    this.unpriceDb = createDb({
      env: env.ENV,
      primaryDatabaseUrl: env.DATABASE_URL,
      read1DatabaseUrl: env.DATABASE_READ1_URL,
      read2DatabaseUrl: env.DATABASE_READ2_URL,
      logger: false,
    })

    // block concurrency while initializing
    this.ctx.blockConcurrencyWhile(async () => {
      // all happen in a try catch to avoid crashing the do
      try {
        // migrate first
        await migrate(this.db, migrations)

        const now = Date.now()
        // get the usage for the customer for every feature
        const ent = await this.db.query.entitlements
          .findMany({
            // only get the entitlement that are active, meaning
            // now is between startAt and endAt + gracePeriod
            where: (e, { and, gte, isNotNull }) =>
              and(isNotNull(e.startAt), isNotNull(e.endAt), gte(e.startAt, now)),
          })
          .catch((e) => {
            // TODO: log it
            console.error("error getting entitlements", e)
            return []
          })

        // entitlement are validated from cache
        // if there are no entitlements an initizalition time
        // then they are set from the cache when reporting or validating
        if (ent.length === 0) return

        // user can't have the same feature slug for different entitlements
        ent.forEach((e) => {
          // lets give a default grace period of 1 day
          const gracePeriod = 1000 * 60 * 60 * 24 // 1 day
          const endAt = e.endAt + gracePeriod

          if (now > endAt) {
            // entitlement is expired
            // TODO: remove the entitlement from the db? log it?
            return
          }

          this.featuresUsage.set(e.featureSlug, {
            usage: Number(e.usage),
            limit: Number(e.limit),
            featureType: e.featureType,
            aggregationMethod: e.aggregationMethod,
            accumulatedUsage: Number(e.accumulatedUsage),
          })
        })
      } catch (e) {
        // TODO: log it and alert
        console.error("error getting usage", e)
        this.featuresUsage.clear()
      }
    })
  }

  // we rely on tinybird to get the current usage and its accumulated usage
  async getInitialUsageTinybird() {
    await this.db
      .select()
      .from(usageRecords)
      .where(sql`timestamp > ${Date.now() - this.TTL}`)
  }

  async reportUsage(data: ReportUsageRequest): Promise<ReportUsageResponse> {
    // first get the entitlement
    let entitlement = this.featuresUsage.get(data.featureSlug)

    if (!entitlement) {
      const result = await this.revalidateEntitlement({
        customerId: data.customerId,
        featureSlug: data.featureSlug,
        projectId: data.projectId,
        now: Date.now(),
      })

      if (!result) {
        return {
          valid: false,
          message: "entitlement not found in do",
        }
      }

      entitlement = this.featuresUsage.get(data.featureSlug)

      if (!entitlement) {
        return {
          valid: false,
          message: "entitlement not found in do",
        }
      }
    }

    // we set alarms to send usage to tinybird
    // this would avoid having too many events in the db
    const alarm = await this.ctx.storage.getAlarm()

    // if there is no alarm set one given the ttl
    if (!alarm) {
      const ttl = data.ttl || this.TTL

      if (ttl > 0) {
        this.ctx.storage.setAlarm(Date.now() + ttl)
      }
    }

    // insert usage into db
    await this.db.insert(usageRecords).values({
      customerId: data.customerId,
      featureSlug: data.featureSlug,
      usage: data.usage.toString(),
      timestamp: Date.now(),
      idempotenceKey: data.idempotenceKey,
      requestId: data.projectId,
      projectId: data.projectId,
      planVersionFeatureId: data.projectId,
      entitlementId: data.projectId,
      subscriptionItemId: data.projectId,
      subscriptionPhaseId: data.projectId,
      subscriptionId: data.projectId,
      createdAt: Date.now(),
      // TODO: add metadata
      // metadata: "",
    })

    // update usage
    if (!this.featuresUsage.get(data.featureSlug)) {
      this.featuresUsage.set(data.featureSlug, {
        ...entitlement,
        usage: entitlement.usage + data.usage,
      })

      // update entitlement
      await this.db
        .update(entitlements)
        .set({
          usage: sql`CAST(${entitlements.usage} AS DECIMAL) + CAST(${data.usage} AS DECIMAL)`,
        })
        .where(eq(entitlements.featureSlug, data.featureSlug))
    }

    const now = Date.now()

    // Only broadcast if enough time has passed since last broadcast
    if (now - this.lastBroadcastTime >= this.DEBOUNCE_DELAY) {
      this.broadcast(
        JSON.stringify({
          customerId: data.customerId,
          featureSlug: data.featureSlug,
          usage: data.usage,
          timestamp: now,
        })
      )
      this.lastBroadcastTime = now
    }

    let newUsage = entitlement.usage + data.usage

    // for features that consider accumulated usage
    // we need to add the accumulated usage to the current usage
    if (entitlement.featureType.endsWith("_all")) {
      newUsage += entitlement.accumulatedUsage
    }

    // return usage
    return {
      valid: true,
      remaining: entitlement.limit - newUsage,
      usage: newUsage,
    }
  }

  onStart(): void | Promise<void> {
    console.info("onStart")
  }

  onConnect(): void | Promise<void> {
    console.info("onConnect")
  }

  async sendToTinybird() {
    // Process events in batches to avoid memory issues
    const BATCH_SIZE = 1000
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

      // Create a Map to deduplicate events based on their unique identifiers
      const uniqueEvents = new Map()
      for (const event of events) {
        // Use a combination of idempotenceKey and entitlementId for deduplication
        const key = `${event.idempotenceKey}-${event.entitlementId}`
        if (!uniqueEvents.has(key)) {
          uniqueEvents.set(key, event)
        }
      }

      const deduplicatedEvents = Array.from(uniqueEvents.values())
      const ids = deduplicatedEvents.map((e) => e.id)

      if (deduplicatedEvents.length > 0) {
        try {
          await this.analytics.ingestFeaturesUsage(deduplicatedEvents)

          // Only delete events that were successfully sent
          await this.db.delete(usageRecords).where(inArray(usageRecords.id, ids))
          processedCount += ids.length
        } catch (error) {
          // TODO: log it and alert
          console.error("Failed to send events to Tinybird:", error)
          // Don't delete events if sending failed
          // We'll try again in the next alarm
          break
        }
      }
      // Update the last processed ID for the next batch
      lastProcessedId = events[events.length - 1]?.id ?? lastProcessedId
    }

    // Log processing statistics
    console.info(`Processed ${processedCount} events in this batch`)
  }

  // websocket message handler
  async onMessage(_conn: Connection, message: string) {
    console.info("onMessage", message)
  }

  async onAlarm(): Promise<void> {
    // send usage to tinybird on alarm
    await this.sendToTinybird()
  }

  // delete the do used when the customer is signed out
  async delete(): Promise<void> {
    await this.ctx.storage.deleteAll()
  }

  async getEntitlementFromUnpriceDb({
    customerId,
    featureSlug,
    projectId,
    now,
  }: {
    customerId: string
    featureSlug: string
    projectId: string
    now: number
  }): Promise<CustomerEntitlement | null> {
    const entitlement = await this.unpriceDb.query.customerEntitlements
      .findFirst({
        where: (e, { and, eq, gte, lte, or, isNull }) =>
          and(
            eq(e.customerId, customerId),
            eq(e.featureSlug, featureSlug),
            eq(e.projectId, projectId),
            gte(e.startAt, now),
            or(isNull(e.endAt), lte(e.endAt, now))
          ),
      })
      .then((entitlement) => {
        return entitlement ?? null
      })

    return entitlement
  }

  async revalidateEntitlement(
    entitlement: {
      customerId: string
      projectId: string
      now: number
      featureSlug: string
    },
    opts: {
      syncDb?: boolean
    } = {}
  ) {
    // get the entitlement from the unprice db
    const entUnpriceDb = await this.getEntitlementFromUnpriceDb({
      customerId: entitlement.customerId,
      featureSlug: entitlement.featureSlug,
      projectId: entitlement.projectId,
      now: entitlement.now,
    })

    if (!entUnpriceDb) {
      return {
        valid: false,
        message: "entitlement not found in unprice db",
      }
    }

    const usage = await this.getUsageFromAnalytics({
      customerId: entitlement.customerId,
      entitlementId: entUnpriceDb.id,
      projectId: entitlement.projectId,
      startAt: entUnpriceDb.startAt,
      endAt: entUnpriceDb.endAt,
      aggregationMethod: entUnpriceDb.aggregationMethod,
    })

    // insert or update the entitlement in the db
    await this.db
      .insert(entitlements)
      .values({
        customerId: entUnpriceDb.customerId,
        projectId: entUnpriceDb.projectId,
        entitlementId: entUnpriceDb.id,
        featureSlug: entUnpriceDb.featureSlug,
        startAt: entUnpriceDb.currentCycleStartAt,
        endAt: entUnpriceDb.currentCycleEndAt,
        aggregationMethod: entUnpriceDb.aggregationMethod,
        usage: usage.usage?.toString(),
        accumulatedUsage: usage.accumulatedUsage?.toString(),
        limit: entUnpriceDb.limit?.toString(),
        gracePeriod: entUnpriceDb.gracePeriod,
        lastUsageUpdateAt: entUnpriceDb.lastUsageUpdateAt,
        featureType: entUnpriceDb.featureType,
      })
      .onConflictDoUpdate({
        target: entitlements.id,
        set: {
          customerId: entUnpriceDb.customerId,
          projectId: entUnpriceDb.projectId,
          entitlementId: entUnpriceDb.id,
          featureSlug: entUnpriceDb.featureSlug,
          startAt: entUnpriceDb.currentCycleStartAt,
          endAt: entUnpriceDb.currentCycleEndAt,
          aggregationMethod: entUnpriceDb.aggregationMethod,
          usage: usage.usage?.toString(),
          accumulatedUsage: usage.accumulatedUsage?.toString(),
          limit: entUnpriceDb.limit?.toString(),
          gracePeriod: entUnpriceDb.gracePeriod,
          lastUsageUpdateAt: entUnpriceDb.lastUsageUpdateAt,
          featureType: entUnpriceDb.featureType,
        },
      })

    if (opts.syncDb) {
      this.ctx.waitUntil(
        this.unpriceDb
          .update(customerEntitlements)
          .set({
            usage: usage.usage?.toString(),
            accumulatedUsage: usage.accumulatedUsage?.toString(),
          })
          .where(
            and(
              eqDb(customerEntitlements.id, entUnpriceDb.id),
              eqDb(customerEntitlements.customerId, entUnpriceDb.customerId)
            )
          )
      )
    }

    this.featuresUsage.set(entUnpriceDb.featureSlug, {
      usage: Number(usage.usage),
      limit: Number(entUnpriceDb.limit),
      featureType: entUnpriceDb.featureType,
      aggregationMethod: entUnpriceDb.aggregationMethod,
      accumulatedUsage: Number(usage.accumulatedUsage),
    })

    return {
      valid: true,
      message: "entitlement revalidated",
    }
  }

  async getUsageFromAnalytics(entitlement: {
    customerId: string
    entitlementId: string
    projectId: string
    startAt: number
    endAt: number | null
    aggregationMethod: AggregationMethod
  }): Promise<{ usage: number; accumulatedUsage: number }> {
    const isAccumulated = entitlement.aggregationMethod.endsWith("_all")
    let currentUsage = 0
    let accumulatedUsage = 0

    // not accumulated then only one query is needed
    if (!isAccumulated) {
      const totalUsage = await this.analytics
        .getFeaturesUsagePeriod({
          customerId: entitlement.customerId,
          entitlementId: entitlement.entitlementId,
          projectId: entitlement.projectId,
          start: entitlement.startAt,
          end: Date.now(), // get the usage for the current cycle
        })
        .then((usage) => usage.data[0])
        .catch((error) => {
          // TODO: log this error
          console.error("error getting usage", error)

          return null
        })

      if (!totalUsage) {
        currentUsage = 0
      } else {
        const usage =
          (totalUsage[entitlement.aggregationMethod as keyof typeof totalUsage] as number) ?? 0
        currentUsage = usage
      }

      accumulatedUsage = 0
    } else {
      // get the total usage and the usage for the current cycle when the entitlement is accumulated
      const [totalAccumulatedUsage, totalUsage] = await Promise.all([
        this.analytics
          .getFeaturesUsageTotal({
            customerId: entitlement.customerId,
            projectId: entitlement.projectId,
            entitlementId: entitlement.entitlementId,
          })
          .then((usage) => usage.data[0])
          .catch((error) => {
            // TODO: log this error
            console.error("error getting usage", error)

            return null
          }),
        this.analytics
          .getFeaturesUsagePeriod({
            customerId: entitlement.customerId,
            entitlementId: entitlement.entitlementId,
            projectId: entitlement.projectId,
            start: entitlement.startAt,
            end: Date.now(), // get the usage for the current cycle
          })
          .then((usage) => usage.data[0])
          .catch((error) => {
            // TODO: log this error
            console.error("error getting usage", error)

            return null
          }),
      ])

      if (!totalUsage) {
        currentUsage = 0
      } else {
        const usage =
          (totalUsage[entitlement.aggregationMethod as keyof typeof totalUsage] as number) ?? 0
        currentUsage = usage
      }

      if (!totalAccumulatedUsage) {
        accumulatedUsage = 0
      } else {
        const usage =
          (totalAccumulatedUsage[
            entitlement.aggregationMethod as keyof typeof totalAccumulatedUsage
          ] as number) ?? 0
        accumulatedUsage = usage
      }
    }

    return {
      usage: currentUsage,
      accumulatedUsage,
    }
  }
}
