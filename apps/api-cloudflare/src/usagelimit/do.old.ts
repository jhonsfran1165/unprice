import { type Connection, Server } from "partyserver"

import { type DrizzleSqliteDODatabase, drizzle } from "drizzle-orm/durable-sqlite"
import { migrate } from "drizzle-orm/durable-sqlite/migrator"
import migrations from "../../drizzle/migrations"

import type { Env } from "~/env"
import type { ReportUsageRequest, ReportUsageResponse } from "./interface"

import {
  type Database,
  and,
  eq as eqUnprice,
  gte as gteUnprice,
  lte as lteUnprice,
} from "@unprice/db"
import { Analytics } from "@unprice/tinybird"
import { inArray as inArraySqlite, sql } from "drizzle-orm"
import { type Entitlement, entitlements, type schema, usageRecords } from "~/db/schema"
import { createDb } from "~/util/db"

import { customerEntitlements, features, planVersionFeatures } from "@unprice/db/schema"
import type { Customer, Project, Subscription } from "@unprice/db/validators"

export class DurableObjectUsagelimiter extends Server {
  // once the durable object is initialized we can avoid
  // querying the db for usage on each request
  private featuresUsage: Map<string, Entitlement> = new Map()
  private currentSubscription: {
    subscription: Subscription
    project: Project
    customer: Customer
  } | null = null
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
  // debounce delay for the broadcast
  private readonly DEBOUNCE_DELAY = 1000 * 1 // 1 second
  // full revalidation grace period
  private readonly FULL_REVALIDATION_GRACE_PERIOD = 1000 * 60 * 60 * 24 // 1 day

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

        // get the current from state
        const currentSubscription = (await this.ctx.storage.get("currentSubscription")) as {
          subscription: Subscription
          project: Project
          customer: Customer
        } | null

        // if there is no current subscription we need to revalidate
        if (!currentSubscription) {
          await this.revalidateSubscription({
            customerId: ctx.id.toString(), // DO id is the customer id
          })
        }

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
      const shouldRevalidateEntitlement = this.shouldRevalidateEntitlement(data.featureSlug)

      if (!shouldRevalidateEntitlement.valid) {
        return {
          valid: false,
          message: shouldRevalidateEntitlement.message,
        }
      }

      const result = await this.revalidateEntitlement({
        customerId: data.customerId,
        projectId: data.projectId,
        featureSlug: data.featureSlug,
        now: Date.now(),
      })

      if (!result.valid) {
        return {
          valid: false,
          message: result.message,
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

    const isValid = this.isValidEntitlement(data.featureSlug)

    if (!isValid.valid) {
      return {
        valid: false,
        message: isValid.message,
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

  isSubscriptionValid(): { valid: boolean; message: string } {
    const gracePeriod = this.FULL_REVALIDATION_GRACE_PERIOD
    const currentSubscription = this.currentSubscription
    const now = Date.now()

    if (!currentSubscription) {
      return {
        valid: false,
        message: "subscription not found in do",
      }
    }

    // project is not active
    if (!currentSubscription.project.enabled) {
      return {
        valid: false,
        message: "project is not active",
      }
    }

    // subscription is not active
    if (!currentSubscription.subscription.active) {
      return {
        valid: false,
        message: "subscription is not active",
      }
    }

    // customer is not active
    if (!currentSubscription.customer.active) {
      return {
        valid: false,
        message: "customer is not active",
      }
    }

    // if revalidation is in progress or the current cycle is not over
    if (
      now < currentSubscription.subscription.currentCycleStartAt ||
      now > currentSubscription.subscription.currentCycleEndAt + gracePeriod
    ) {
      return {
        valid: false,
        message: "revalidation in progress or current cycle is not over",
      }
    }

    return {
      valid: true,
      message: "subscription is valid",
    }
  }

  async revalidateSubscription({
    customerId,
  }: {
    customerId: string
  }): Promise<void> {
    if (this.revalidationInProgress) return
    const now = Date.now()
    const shouldRevalidate = this.shouldRevalidateSubscription()

    if (!shouldRevalidate.valid) {
      return
    }

    try {
      this.revalidationInProgress = true

      const data = await this.unpriceDb.query.subscriptions
        .findFirst({
          with: {
            customer: true,
            project: true,
          },
          where: (s, { eq, and, gte }) =>
            and(eq(s.customerId, customerId), eq(s.active, true), gte(s.currentCycleStartAt, now)),
        })
        .catch((e) => {
          // TODO: log it
          console.error("error getting subscription", e)
          return null
        })

      if (!data) {
        return
      }

      const { project, customer, ...subscription } = data

      // save the current cycle start and end at for next full revalidation
      await this.ctx.storage.put("currentSubscription", {
        subscription: subscription,
        project: project,
        customer: customer,
      })

      // flush entitlements
      this.featuresUsage.clear()
      // clean entitlements from db
      await this.db.delete(entitlements)
    } finally {
      this.revalidationInProgress = false
    }
  }

  shouldRevalidateSubscription(): { valid: boolean; message: string } {
    const currentSubscription = this.currentSubscription

    if (!currentSubscription) {
      return {
        valid: false,
        message: "subscription not found in state of do",
      }
    }

    const now = Date.now()
    const gracePeriod = this.FULL_REVALIDATION_GRACE_PERIOD
    const currentCycleEndAt = currentSubscription.subscription.currentCycleEndAt
    const currentCycleStartAt = currentSubscription.subscription.currentCycleStartAt

    // only revalidate if subscription cycle is over
    if (now < currentCycleStartAt || now > currentCycleEndAt + gracePeriod) {
      return {
        valid: true,
        message: "subscription cycle is not over",
      }
    }

    return {
      valid: false,
      message: "subscription cycle is over",
    }
  }

  shouldRevalidateEntitlement(featureSlug: string) {
    const entitlement = this.featuresUsage.get(featureSlug)
    if (!entitlement) {
      return {
        valid: false,
        message: "entitlement not found in do",
      }
    }

    const now = Date.now()
    const bufferPeriod = entitlement.bufferPeriodDays * 24 * 60 * 60 * 1000
    const validUntil = entitlement.validTo + bufferPeriod

    if (now < entitlement.validFrom || now > validUntil) {
      return {
        valid: false,
        message: "entitlement is expired",
      }
    }

    return {
      valid: true,
      message: "entitlement is valid",
    }
  }

  isValidEntitlement(featureSlug: string) {
    const entitlement = this.featuresUsage.get(featureSlug)
    // entitlement is valid if the subscription is valid
    const subscription = this.isSubscriptionValid()

    if (!subscription.valid) {
      return {
        valid: false,
        message: subscription.message,
      }
    }

    if (!entitlement) {
      return {
        valid: false,
        message: "entitlement not found in do",
      }
    }

    if (entitlement.featureType === "flat") {
      return {
        valid: false,
        message: "entitlement is flat",
      }
    }

    return {
      valid: true,
      message: "entitlement is valid",
    }
  }

  async revalidateEntitlement({
    customerId,
    projectId,
    featureSlug,
    now,
  }: {
    customerId: string
    projectId: string
    featureSlug: string
    now: number
  }) {
    const entitlement = await this.unpriceDb
      .select({
        customerEntitlement: customerEntitlements,
        featureType: planVersionFeatures.featureType,
        aggregationMethod: planVersionFeatures.aggregationMethod,
      })
      .from(customerEntitlements)
      .leftJoin(
        planVersionFeatures,
        eqUnprice(customerEntitlements.featurePlanVersionId, planVersionFeatures.id)
      )
      .leftJoin(features, eqUnprice(planVersionFeatures.featureId, features.id))
      .where(
        and(
          eqUnprice(features.slug, featureSlug),
          eqUnprice(customerEntitlements.customerId, customerId),
          eqUnprice(customerEntitlements.projectId, projectId),
          eqUnprice(customerEntitlements.active, true),
          gteUnprice(customerEntitlements.validFrom, now),
          lteUnprice(customerEntitlements.validTo, now)
        )
      )
      .then((e) => e[0])
      .catch((e) => {
        // TODO: log it
        console.error("error getting entitlement", e)
        return null
      })

    if (!entitlement || !entitlement.featureType || !entitlement.aggregationMethod) {
      return {
        valid: false,
        message: "entitlement not found in unprice db",
      }
    }

    const { customerEntitlement: activeEntitlement, featureType, aggregationMethod } = entitlement

    if (!activeEntitlement) {
      return {
        valid: false,
        message: "active entitlement not found in unprice db",
      }
    }

    // get the usages for the entitlements from analytics
    const { totalAccumulatedUsage, totalUsage } = await this.getUsageFromAnalytics({
      customerId,
      projectId,
      startAt: activeEntitlement.validFrom,
      endAt: Date.now(),
      featureSlug,
      isAccumulated: featureType.endsWith("_all"),
    })

    const entitlementDo = {
      id: activeEntitlement.id,
      customerId: activeEntitlement.customerId,
      projectId: activeEntitlement.projectId,
      entitlementId: activeEntitlement.id,
      featureSlug: featureSlug,
      validFrom: activeEntitlement.validFrom,
      validTo: activeEntitlement.validTo,
      bufferPeriodDays: activeEntitlement.bufferPeriodDays,
      aggregationMethod: aggregationMethod,
      featureType: featureType,
      usage: totalUsage.toString(),
      accumulatedUsage: totalAccumulatedUsage.toString(),
      limit: activeEntitlement.limit,
      lastUsageUpdateAt: Date.now(),
      subscriptionItemId: activeEntitlement.subscriptionItemId,
      subscriptionPhaseId: activeEntitlement.subscriptionPhaseId,
      subscriptionId: activeEntitlement.subscriptionId,
      resetedAt: activeEntitlement.resetedAt,
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
      // update the entitlement in the unprice db
      this.unpriceDb
        .update(customerEntitlements)
        .set({
          usage: entitlementDo.usage,
          accumulatedUsage: entitlementDo.accumulatedUsage,
          lastUsageUpdateAt: Date.now(),
        })
        .where(
          and(
            eqUnprice(customerEntitlements.id, entitlementDo.id),
            eqUnprice(customerEntitlements.customerId, entitlementDo.customerId),
            eqUnprice(customerEntitlements.projectId, entitlementDo.projectId)
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

  async getUsageFromAnalytics({
    customerId,
    projectId,
    featureSlug,
    startAt,
    endAt,
    isAccumulated = false,
  }: {
    customerId: string
    projectId: string
    featureSlug: string
    startAt: number
    endAt: number
    isAccumulated?: boolean
  }) {
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
              // TODO: log this error
              console.error("error getting usage", error)

              return null
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
          // TODO: log this error
          console.error("error getting usage", error)

          return null
        }),
    ])

    return {
      totalAccumulatedUsage: totalAccumulatedUsage ?? 0,
      totalUsage: totalUsage ?? 0,
    }
  }
}
