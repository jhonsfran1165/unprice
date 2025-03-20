import { type Connection, Server } from "partyserver"

import { type DrizzleSqliteDODatabase, drizzle } from "drizzle-orm/durable-sqlite"
import { migrate } from "drizzle-orm/durable-sqlite/migrator"
import migrations from "../../drizzle/migrations"

import type { Env } from "~/env"
import type { ReportUsageRequest, ReportUsageResponse } from "./interface"

import { type Database, type SQL, and, eq as eqDb, inArray, sql as sqlDrizzle } from "@unprice/db"
import { customerEntitlements } from "@unprice/db/schema"
import { Analytics } from "@unprice/tinybird"
import { inArray as inArraySqlite, sql } from "drizzle-orm"
import { type Entitlement, entitlements, type schema, usageRecords } from "~/db/schema"
import { createDb } from "~/util/db"

export class DurableObjectUsagelimiter extends Server {
  // once the durable object is initialized we can avoid
  // querying the db for usage on each request
  private featuresUsage: Map<string, Entitlement> = new Map()
  // we avoid revalidating the entitlements if there is already a revalidation in progress
  private revalidationInProgress = false
  // internal database of the do
  private db: DrizzleSqliteDODatabase<typeof schema>
  // unprice database
  private unpriceDb: Database
  // tinybird analytics
  private analytics: Analytics
  // Default ttl for the usage records
  private readonly TTL = 1000 * 60 // 60 secs
  // Debounce delay for the broadcast
  private lastBroadcastTime = 0
  // full revalidation interval (24 hours)
  private readonly FULL_REVALIDATION_GRACE_PERIOD = 1000 * 60 * 60 * 24 // 24 hours
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
            // only get the entitlement that are active
            where: (e, { gte }) => gte(e.validFrom, now),
          })
          .catch((e) => {
            // TODO: log it
            console.error("error getting entitlements", e)
            return []
          })

        // entitlement are revalidated on each request when needed
        if (ent.length === 0) return

        // user can't have the same feature slug for different entitlements
        ent.forEach((e) => {
          this.featuresUsage.set(e.featureSlug, e)
        })
      } catch (e) {
        // TODO: log it and alert
        console.error("error getting usage", e)
        this.featuresUsage.clear()
      }
    })
  }

  async reportUsage(data: ReportUsageRequest): Promise<ReportUsageResponse> {
    // first get the entitlement
    let entitlement = this.featuresUsage.get(data.featureSlug)

    if (!entitlement) {
      const result = await this.revalidateSingleEntitlement({
        customerId: data.customerId,
        projectId: data.projectId,
        featureSlug: data.featureSlug,
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

    if (!entitlement) {
      return {
        valid: false,
        message: "entitlement not found in do",
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
      requestId: data.requestId,
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

    let newUsage = Number(entitlement.usage) + data.usage

    // for features that consider accumulated usage
    // we need to add the accumulated usage to the current usage
    if (entitlement.featureType.endsWith("_all")) {
      newUsage += Number(entitlement.accumulatedUsage)
    }

    // return usage
    return {
      valid: true,
      remaining: Number(entitlement.limit) - newUsage,
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
          await this.db.delete(usageRecords).where(inArraySqlite(usageRecords.id, ids))
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

  async shouldPerformFullRevalidation(now: number): Promise<boolean> {
    const gracePeriod = this.FULL_REVALIDATION_GRACE_PERIOD
    const currentCycle = (await this.ctx.storage.get("currentCycle")) as {
      currentCycleStartAt: number
      currentCycleEndAt: number
    } | null

    if (!currentCycle) {
      return false
    }

    // if revalidation is in progress or the current cycle is not over
    // we don't need to perform a full revalidation
    if (this.revalidationInProgress || now < currentCycle.currentCycleEndAt + gracePeriod) {
      return false
    }

    return true
  }

  async fullRevalidationEntitlements({
    customerId,
    projectId,
    now,
  }: {
    customerId: string
    projectId: string
    now: number
  }): Promise<void> {
    if (this.revalidationInProgress) return

    try {
      this.revalidationInProgress = true

      const data = await this.unpriceDb.query.subscriptions
        .findFirst({
          with: {
            customer: true,
            customerEntitlements: {
              where: (e, { eq }) => eq(e.active, true),
              with: {
                featurePlanVersion: {
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
          where: (s, { eq, and }) =>
            and(eq(s.customerId, customerId), eq(s.projectId, projectId), eq(s.active, true)),
        })
        .catch((e) => {
          // TODO: log it
          console.error("error getting subscription", e)
          return null
        })

      if (!data) {
        // TODO: log it
        return
      }

      const { customerEntitlements: unpriceEntitlements, customer, ...subscription } = data

      // if the customer is not active
      if (!customer.active) {
        // TODO: log it
        return
      }

      // if there are no entitlements active
      if (unpriceEntitlements.length === 0) {
        // TODO: log it
        return
      }

      // current cycle of the subscription
      const { currentCycleStartAt, currentCycleEndAt } = subscription

      // save the current cycle start and end at for next full revalidation
      await this.ctx.storage.put("currentCycle", {
        currentCycleStartAt: currentCycleStartAt,
        currentCycleEndAt: currentCycleEndAt,
      })

      // usage for the current cycle to get the usage and accumulated usage
      const { totalAccumulatedUsage, totalUsages } = await this.getUsagesFromAnalytics({
        customerId,
        projectId,
        startAt: currentCycleStartAt,
        endAt: now,
      })

      const preparedEntitlements = unpriceEntitlements.map((e) => {
        const entitlementDo = {
          id: e.id,
          customerId: e.customerId,
          projectId: e.projectId,
          entitlementId: e.id,
          featureSlug: e.featurePlanVersion.feature.slug,
          validFrom: e.validFrom,
          validTo: e.validTo,
          bufferPeriodDays: e.bufferPeriodDays,
          aggregationMethod: e.featurePlanVersion.aggregationMethod,
          featureType: e.featurePlanVersion.featureType,
          usage: "0",
          accumulatedUsage: "0",
          limit: e.limit?.toString(),
          lastUsageUpdateAt: Date.now(),
          subscriptionItemId: e.subscriptionItemId,
          subscriptionPhaseId: e.subscriptionPhaseId,
          subscriptionId: e.subscriptionId,
          resetedAt: e.resetedAt,
        }
        if (!totalUsages || !totalAccumulatedUsage) {
          return entitlementDo
        }

        const featureSlug = e.featurePlanVersion.feature.slug
        const aggregationMethod = e.featurePlanVersion.aggregationMethod

        const usage = totalUsages.find((u) => u.featureSlug === featureSlug)
        const accumulatedUsage = totalAccumulatedUsage.find((u) => u.featureSlug === featureSlug)

        if (!usage || !accumulatedUsage) {
          return entitlementDo
        }

        const usageValue = (usage[aggregationMethod as keyof typeof usage] as number) ?? 0
        const accumulatedUsageValue =
          (accumulatedUsage[aggregationMethod as keyof typeof accumulatedUsage] as number) ?? 0

        return {
          ...entitlementDo,
          usage: usageValue.toString(),
          accumulatedUsage: accumulatedUsageValue.toString(),
        }
      })

      // this happen in a transaction
      await this.db.transaction(async (tx) => {
        // delete all entitlements in the do and reinsert them
        await tx.delete(entitlements)
        // insert the entitlements
        await tx.insert(entitlements).values(preparedEntitlements)
      })

      // update the usage of the entitlement in unprice db
      const sqlUsage: SQL[] = []
      const sqlAccumulatedUsage: SQL[] = []
      const ids: string[] = []

      sqlUsage.push(sqlDrizzle`(case`)
      sqlAccumulatedUsage.push(sqlDrizzle`(case`)

      for (const newEntitlement of preparedEntitlements) {
        sqlUsage.push(
          sqlDrizzle`when ${customerEntitlements.id} = ${newEntitlement.id} then ${newEntitlement.usage}`
        )
        sqlAccumulatedUsage.push(
          sqlDrizzle`when ${customerEntitlements.id} = ${newEntitlement.id} then ${newEntitlement.accumulatedUsage}`
        )
        ids.push(newEntitlement.id)
      }

      sqlUsage.push(sqlDrizzle`end)`)

      const finalSql: SQL = sqlDrizzle.join(sqlUsage, sqlDrizzle.raw(" "))
      const finalSqlAccumulatedUsage: SQL = sqlDrizzle.join(
        sqlAccumulatedUsage,
        sqlDrizzle.raw(" ")
      )

      // don't await this to avoid blocking the transaction
      this.ctx.waitUntil(
        this.unpriceDb
          .update(customerEntitlements)
          .set({
            usage: finalSql,
            accumulatedUsage: finalSqlAccumulatedUsage,
            lastUsageUpdateAt: Date.now(),
          })
          .where(
            and(
              inArray(customerEntitlements.id, ids),
              eqDb(customerEntitlements.projectId, projectId),
              eqDb(customerEntitlements.customerId, customerId)
            )
          )
      )
    } finally {
      this.revalidationInProgress = false
    }
  }

  shouldRevalidateEntitlement(featureSlug: string, now: number) {
    const entitlement = this.featuresUsage.get(featureSlug)

    if (!entitlement) {
      return true
    }

    const bufferPeriod = entitlement.bufferPeriodDays * 24 * 60 * 60 * 1000
    const resetAt = entitlement.validTo + bufferPeriod

    if (now > resetAt) {
      return true
    }

    return false
  }

  isValidEntitlement(featureSlug: string, now: number) {
    const entitlement = this.featuresUsage.get(featureSlug)

    if (!entitlement) {
      return false
    }

    if (entitlement.featureType === "flat") {
      return false
    }

    const bufferPeriod = entitlement.bufferPeriodDays * 24 * 60 * 60 * 1000
    const validUntil = entitlement.validTo + bufferPeriod

    if (now < entitlement.validFrom || now > validUntil) {
      return false
    }

    return true
  }

  async revalidateSingleEntitlement(entitlement: {
    customerId: string
    projectId: string
    featureSlug: string
    now: number
  }) {
    // get current cycle from unprice db
    const currentCycle = (await this.ctx.storage.get("currentCycle")) as {
      currentCycleStartAt: number
      currentCycleEndAt: number
    } | null

    if (!currentCycle) {
      return {
        valid: false,
        message: "current cycle not found in do",
      }
    }

    // get active entitlements from the unprice db
    const unpriceEntitlements = await this.unpriceDb.query.customerEntitlements.findMany({
      with: {
        featurePlanVersion: {
          with: {
            feature: {
              columns: {
                slug: true,
              },
            },
          },
        },
      },
      where: (e, { eq, gte, lte, and }) =>
        and(
          eq(e.projectId, entitlement.projectId),
          eq(e.active, true),
          gte(e.validFrom, currentCycle.currentCycleStartAt),
          lte(e.validTo, currentCycle.currentCycleEndAt)
        ),
    })

    if (!unpriceEntitlements) {
      return {
        valid: false,
        message: "entitlement not found in unprice db",
      }
    }

    const activeEntitlement = unpriceEntitlements.find(
      (e) => e.featurePlanVersion.feature.slug === entitlement.featureSlug
    )

    if (!activeEntitlement) {
      return {
        valid: false,
        message: "entitlement not found in unprice db",
      }
    }
    // get the usages for the entitlements from analytics
    const { totalAccumulatedUsage, totalUsages } = await this.getUsagesFromAnalytics({
      customerId: entitlement.customerId,
      projectId: entitlement.projectId,
      startAt: currentCycle.currentCycleStartAt,
      endAt: Date.now(),
      featureSlug: entitlement.featureSlug,
    })

    const entitlementDo = {
      id: activeEntitlement.id,
      customerId: activeEntitlement.customerId,
      projectId: activeEntitlement.projectId,
      entitlementId: activeEntitlement.id,
      featureSlug: activeEntitlement.featurePlanVersion.feature.slug,
      validFrom: activeEntitlement.validFrom,
      validTo: activeEntitlement.validTo,
      bufferPeriodDays: activeEntitlement.bufferPeriodDays,
      aggregationMethod: activeEntitlement.featurePlanVersion.aggregationMethod,
      featureType: activeEntitlement.featurePlanVersion.featureType,
      usage: "0",
      accumulatedUsage: "0",
      limit: activeEntitlement.limit?.toString() ?? null,
      lastUsageUpdateAt: Date.now(),
      subscriptionItemId: activeEntitlement.subscriptionItemId,
      subscriptionPhaseId: activeEntitlement.subscriptionPhaseId,
      subscriptionId: activeEntitlement.subscriptionId,
      resetedAt: activeEntitlement.resetedAt,
    }

    if (totalUsages && totalAccumulatedUsage) {
      const featureSlug = activeEntitlement.featurePlanVersion.feature.slug
      const aggregationMethod = activeEntitlement.featurePlanVersion.aggregationMethod

      const usage = totalUsages.find((u) => u.featureSlug === featureSlug)
      const accumulatedUsage = totalAccumulatedUsage.find((u) => u.featureSlug === featureSlug)

      if (!usage || !accumulatedUsage) {
        return entitlementDo
      }

      const usageValue = (usage[aggregationMethod as keyof typeof usage] as number) ?? 0
      const accumulatedUsageValue =
        (accumulatedUsage[aggregationMethod as keyof typeof accumulatedUsage] as number) ?? 0

      entitlementDo.usage = usageValue.toString()
      entitlementDo.accumulatedUsage = accumulatedUsageValue.toString()
    }

    // insert or update the entitlement in the db
    await this.db
      .insert(entitlements)
      .values(entitlementDo)
      .onConflictDoUpdate({
        target: entitlements.id,
        set: {
          ...entitlementDo,
        },
      })

    this.ctx.waitUntil(
      this.unpriceDb
        .update(customerEntitlements)
        .set({
          usage: entitlementDo.usage,
          accumulatedUsage: entitlementDo.accumulatedUsage,
        })
        .where(
          and(
            eqDb(customerEntitlements.id, entitlementDo.id),
            eqDb(customerEntitlements.customerId, entitlementDo.customerId),
            eqDb(customerEntitlements.projectId, entitlementDo.projectId)
          )
        )
    )

    this.featuresUsage.set(entitlementDo.featureSlug, entitlementDo)

    return {
      valid: true,
      message: "entitlement revalidated",
    }
  }

  async getUsage(featureSlug: string): Promise<Entitlement | null> {
    const entitlement = this.featuresUsage.get(featureSlug)

    if (!entitlement) {
      return null
    }

    return entitlement
  }

  async getUsagesFromAnalytics({
    customerId,
    projectId,
    featureSlug,
    startAt,
    endAt,
  }: {
    customerId: string
    projectId: string
    // optional feature slug to get the usage for a specific feature
    featureSlug?: string
    startAt: number
    endAt: number
  }) {
    // get the total usage and the usage for the current cycle
    const [totalAccumulatedUsage, totalUsages] = await Promise.all([
      this.analytics
        .getFeaturesUsageTotal({
          customerId,
          projectId,
          featureSlug,
        })
        .then((usage) => usage.data)
        .catch((error) => {
          // TODO: log this error
          console.error("error getting usage", error)

          return null
        }),
      this.analytics
        .getFeaturesUsagePeriod({
          customerId,
          projectId,
          featureSlug,
          start: startAt,
          end: endAt,
        })
        .then((usage) => usage.data)
        .catch((error) => {
          // TODO: log this error
          console.error("error getting usage", error)

          return null
        }),
    ])

    return {
      totalAccumulatedUsage,
      totalUsages,
    }
  }
}
