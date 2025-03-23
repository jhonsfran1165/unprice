import { type Connection, Server } from "partyserver"

import { type DrizzleSqliteDODatabase, drizzle } from "drizzle-orm/durable-sqlite"
import { migrate } from "drizzle-orm/durable-sqlite/migrator"
import migrations from "../../drizzle/migrations"

import type { Env } from "~/env"
import type { CanRequest, ReportUsageRequest, ReportUsageResponse } from "./interface"

import {
  type Database,
  and,
  eq as eqUnprice,
  gte as gteUnprice,
  lte as lteUnprice,
} from "@unprice/db"
import { Analytics } from "@unprice/tinybird"
import { count, eq, inArray, lte, sql } from "drizzle-orm"
import { entitlements, usageRecords, verifications } from "~/db/schema"
import type { Entitlement, schema } from "~/db/types"
import { createDb } from "~/util/db"

import { env } from "cloudflare:workers"
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
  private readonly MS_TTL = 1000 * 5 // 5 secs
  // Debounce delay for the broadcast
  private lastBroadcastTime = 0
  // debounce delay for the broadcast
  private readonly DEBOUNCE_DELAY = 1000 * 1 // 1 second
  // full revalidation grace period
  // once the current cycle is over we need to revalidate the entitlements
  //  this give us a buffer between subscription renewals and the next entitlement revalidation
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
        await this._migrate()

        // get the current from state
        const currentSubscription = (await this.ctx.storage.get("currentSubscription")) as {
          subscription: Subscription
          project: Project
          customer: Customer
        } | null

        // set the current subscription
        this.currentSubscription = currentSubscription

        const now = Date.now()
        // get the usage for the customer for every feature
        const entitlementsDO = await this.db
          .select()
          .from(entitlements)
          .where(lte(entitlements.validFrom, now))
          .catch((e) => {
            // TODO: log it
            console.error("error getting entitlements from do", e)
            return []
          })

        // entitlement are revalidated on each request when needed
        if (entitlementsDO.length === 0) return

        // user can't have the same feature slug for different entitlements
        entitlementsDO.forEach((e) => {
          this.featuresUsage.set(e.featureSlug, e)
        })
      } catch (e) {
        // TODO: log it and alert
        console.error("error getting usage", e)
        this.featuresUsage.clear()
      }
    })
  }

  async _migrate() {
    try {
      await migrate(this.db, migrations)
    } catch (error) {
      // TODO: log it
      console.error("error migrating", error)

      console.error("Migration failed:", error)
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
    }
  }

  async can(data: CanRequest): Promise<{
    success: boolean
    message: string
  }> {
    const now = performance.now()
    // if there is no current subscription we need to revalidate
    if (!this.currentSubscription) {
      await this.revalidateSubscription({
        customerId: data.customerId,
      })
    }

    // first get the entitlement
    let entitlement = this.featuresUsage.get(data.featureSlug)

    if (!entitlement) {
      const result = await this.revalidateEntitlement({
        customerId: data.customerId,
        projectId: data.projectId,
        featureSlug: data.featureSlug,
        now: Date.now(),
      })

      if (!result.success) {
        return {
          success: false,
          message: result.message,
        }
      }

      // if after revalidating the entitlement is not found we need to return an error
      entitlement = this.featuresUsage.get(data.featureSlug)

      if (!entitlement) {
        return {
          success: false,
          message: "entitlement not found in do",
        }
      }
    }

    // check if the entitlement is valid
    const isValid = this.isValidEntitlement(data.featureSlug)

    if (!isValid.valid) {
      return {
        success: false,
        message: isValid.message,
      }
    }

    // we set alarms to send usage to tinybird periodically
    // this would avoid having too many events in the db as well
    const alarm = await this.ctx.storage.getAlarm()

    // there is a default ttl for the usage records
    // alternatively we can use the secondsToLive from the request
    // secondsToLive is a pro feature so depending on the plan we can use it or not
    const nextAlarm = data.secondsToLive
      ? Date.now() + data.secondsToLive * 1000
      : Date.now() + this.MS_TTL

    // if there is no alarm set one given the ttl
    if (!alarm) {
      this.ctx.storage.setAlarm(nextAlarm)
    } else if (alarm < Date.now()) {
      // delete the alarm if it is in the past
      // and set it again
      this.ctx.storage.deleteAlarm()
      this.ctx.storage.setAlarm(nextAlarm)
    }

    // TODO: check this
    // at this point we basically validate the user has access to the feature
    const result = this.checkLimit(entitlement)
    const latency = performance.now() - now

    // create a verification record
    const verification = await this.db
      .insert(verifications)
      .values({
        entitlementId: entitlement.entitlementId,
        customerId: data.customerId,
        projectId: data.projectId,
        featureSlug: data.featureSlug,
        requestId: data.requestId,
        timestamp: Date.now(),
        createdAt: Date.now(),
        latency: latency.toString() ?? "0",
        metadata: JSON.stringify(data.metadata),
        deniedReason: result.message,
        planVersionFeatureId: entitlement.planVersionFeatureId,
        subscriptionItemId: entitlement.subscriptionItemId,
        subscriptionPhaseId: entitlement.subscriptionPhaseId,
        subscriptionId: entitlement.subscriptionId,
      })
      .returning()
      .catch((e) => {
        // TODO: log it
        console.error("error inserting verification", e)
        return null
      })
      .then((result) => {
        return result?.[0] ?? null
      })

    if (!verification) {
      return {
        success: false,
        message: "error inserting verification",
      }
    }

    return {
      success: result.success,
      message: result.message,
    }
  }

  private checkLimit(entitlement: Entitlement) {
    switch (entitlement.featureType) {
      case "flat":
        return { success: true, message: "flat feature" }
      case "tier":
      case "package":
      case "usage": {
        const { usage, limit } = entitlement
        const hitLimit = limit ? Number(usage) > Number(limit) : false

        if (hitLimit) {
          return { success: false, message: "limit exceeded" }
        }

        return { success: true, message: "can" }
      }
    }
  }

  async reportUsage(data: ReportUsageRequest): Promise<ReportUsageResponse> {
    // if there is no current subscription we need to revalidate
    if (!this.currentSubscription) {
      await this.revalidateSubscription({
        customerId: data.customerId,
      })
    }

    // first get the entitlement
    let entitlement = this.featuresUsage.get(data.featureSlug)

    if (!entitlement) {
      const result = await this.revalidateEntitlement({
        customerId: data.customerId,
        projectId: data.projectId,
        featureSlug: data.featureSlug,
        now: data.date,
      })

      if (!result.success) {
        return {
          success: false,
          message: result.message,
        }
      }

      // if after revalidating the entitlement is not found we need to return an error
      entitlement = this.featuresUsage.get(data.featureSlug)

      if (!entitlement) {
        return {
          success: false,
          message: "entitlement not found in do",
        }
      }
    }

    // check if the entitlement is valid
    const isValid = this.isValidEntitlement(data.featureSlug)

    if (!isValid.valid) {
      return {
        success: false,
        message: isValid.message,
      }
    }

    // we set alarms to send usage to tinybird periodically
    // this would avoid having too many events in the db as well
    const alarm = await this.ctx.storage.getAlarm()

    // there is a default ttl for the usage records
    // alternatively we can use the secondsToLive from the request
    // secondsToLive is a pro feature so depending on the plan we can use it or not
    const nextAlarm = data.secondsToLive
      ? Date.now() + data.secondsToLive * 1000
      : Date.now() + this.MS_TTL

    // if there is no alarm set one given the ttl
    if (!alarm) {
      this.ctx.storage.setAlarm(nextAlarm)
    } else if (alarm < Date.now()) {
      // delete the alarm if it is in the past
      // and set it again
      this.ctx.storage.deleteAlarm()
      this.ctx.storage.setAlarm(nextAlarm)
    }

    // insert usage into db
    const usageRecord = await this.db
      .insert(usageRecords)
      .values({
        customerId: data.customerId,
        featureSlug: data.featureSlug,
        usage: data.usage.toString(),
        timestamp: data.date,
        idempotenceKey: data.idempotenceKey,
        requestId: data.requestId,
        projectId: data.projectId,
        planVersionFeatureId: entitlement.planVersionFeatureId,
        entitlementId: entitlement.entitlementId,
        subscriptionItemId: entitlement.subscriptionItemId,
        subscriptionPhaseId: entitlement.subscriptionPhaseId,
        subscriptionId: entitlement.subscriptionId,
        createdAt: Date.now(),
        metadata: JSON.stringify(data.metadata),
      })
      .returning()
      .catch((e) => {
        // TODO: log it
        console.error("error inserting usage", e)
      })
      .then((result) => {
        return result?.[0] ?? null
      })

    if (!usageRecord) {
      return {
        success: false,
        message: "error inserting usage, please try again later",
      }
    }

    const now = Date.now()

    // Only broadcast if enough time has passed since last broadcast
    // defailt 1 per second
    // this is used to debug events in real time in unprice dashboard
    if (now - this.lastBroadcastTime >= this.DEBOUNCE_DELAY) {
      this.broadcast(JSON.stringify(usageRecord))
      this.lastBroadcastTime = now
    }

    const result = await this.setUsage(entitlement, data.usage)

    if (!result.success) {
      return {
        success: false,
        message: result.message,
      }
    }

    // return usage
    return {
      success: true,
      entitlement: result.entitlement,
      message: result.message,
      notifyUsage: result.notifyUsage,
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

  private async setUsage(entitlement: Entitlement, usage: number) {
    const threshold = 80 // notify when the usage is 80% or more
    const limit = Number(entitlement.limit)

    let message = ""
    let notifyUsage = false

    // check flat features
    if (entitlement.featureType === "flat") {
      return {
        success: false,
        message: "feature is flat, limit is not applicable",
        newUsage: 1,
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
      })
      .where(eq(entitlements.id, entitlement.id))
      .returning()
      .catch((e) => {
        // TODO: log it
        console.error("error updating entitlement", e)
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

    return { success: true, message, notifyUsage, entitlement: updatedEntitlement }
  }

  onStart(): void | Promise<void> {
    console.info("onStart")
  }

  onConnect(): void | Promise<void> {
    console.info("onConnect")
  }

  async sendVerificationsToTinybird() {
    // Process events in batches to avoid memory issues
    const BATCH_SIZE = 1000
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

      const ids = verificationEvents.map((e) => e.id)

      if (ids.length > 0) {
        try {
          const transformedEvents = verificationEvents.map((event) => ({
            featureSlug: event.featureSlug,
            entitlementId: event.id.toString(),
            customerId: event.customerId,
            projectId: event.projectId,
            subscriptionId: event.subscriptionId,
            subscriptionPhaseId: event.subscriptionPhaseId,
            subscriptionItemId: event.subscriptionItemId,
            timestamp: event.timestamp,
            status: event.deniedReason,
            metadata: event.metadata ? JSON.parse(event.metadata) : null,
            latency: event.latency ? Number(event.latency) : 0,
            requestId: event.requestId,
            planVersionFeatureId: event.planVersionFeatureId,
          }))

          await this.analytics
            .ingestFeaturesVerification(transformedEvents)
            .catch((e) => {
              // TODO: log it and alert
              console.error("Failed to send verifications to Tinybird:", e)
            })
            .then((data) => {
              const rows = data?.successful_rows ?? 0
              const quarantined = data?.quarantined_rows ?? 0

              const total = rows + quarantined

              if (total >= ids.length) {
                // TODO: log it quarantined rows
                console.info("deleted verifications", rows)
                // Only delete events that were successfully sent
                this.db.delete(verifications).where(inArray(verifications.id, ids))
                processedCount += ids.length
              } else {
                console.info("failed to send verifications to Tinybird", data)
              }
            })
        } catch (error) {
          // TODO: log it and alert
          console.error("Failed to send verifications to Tinybird:", error)
          // Don't delete events if sending failed
          // We'll try again in the next alarm
          break
        }
      }
      // Update the last processed ID for the next batch
      lastProcessedId = verificationEvents[verificationEvents.length - 1]?.id ?? lastProcessedId
    }

    // Log processing statistics
    console.info(`Processed ${processedCount} verifications in this batch`)
  }

  async sendUsageToTinybird() {
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
        // in dev we use the idempotence key and timestamp to deduplicate so we can test the usage
        const key =
          env.NODE_ENV === "production"
            ? `${event.idempotenceKey}`
            : `${event.idempotenceKey}-${event.timestamp}`

        if (!uniqueEvents.has(key)) {
          uniqueEvents.set(key, event)
        }
      }

      const deduplicatedEvents = Array.from(uniqueEvents.values())
      const ids = deduplicatedEvents.map((e) => e.id)

      if (deduplicatedEvents.length > 0) {
        try {
          await this.analytics.ingestFeaturesUsage(deduplicatedEvents).catch((e) => {
            // TODO: log it and alert
            console.error("Failed to send events to Tinybird:", e)
          })

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
    console.info(`Processed ${processedCount} usage events in this batch`)
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
  }> {
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

    console.info(
      `DO has ${events?.count} events and ${verification_events?.count} verification events`
    )

    // if there are no events, delete the do
    if (events?.count === 0 && verification_events?.count === 0) {
      await this.ctx.storage.deleteAll()
    } else {
      return {
        success: false,
        message: `DO has ${events?.count} events and ${verification_events?.count} verification events, not deleting.`,
      }
    }

    return {
      success: true,
      message: "DO deleted",
    }
  }

  private isSubscriptionValid(): { valid: boolean; message: string } {
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
          where: (s, { eq, and, lte, gte }) =>
            and(
              eq(s.customerId, customerId),
              eq(s.active, true),
              lte(s.currentCycleStartAt, now),
              gte(s.currentCycleEndAt, now)
            ),
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

      // set the current subscription
      this.currentSubscription = {
        subscription: subscription,
        project: project,
        customer: customer,
      }

      // flush entitlements
      this.featuresUsage.clear()
      // clean entitlements from db
      await this.db.delete(entitlements)
    } finally {
      this.revalidationInProgress = false
    }
  }

  private shouldRevalidateSubscription(): { valid: boolean; message: string } {
    const currentSubscription = this.currentSubscription

    if (!currentSubscription) {
      return {
        valid: true,
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

  private shouldRevalidateEntitlement(featureSlug: string) {
    const entitlement = this.featuresUsage.get(featureSlug)
    if (!entitlement) {
      return {
        valid: true,
        message: "entitlement not found in do",
      }
    }

    const now = Date.now()
    const bufferPeriod = entitlement.bufferPeriodDays * 24 * 60 * 60 * 1000
    const validUntil = entitlement.validTo + bufferPeriod

    if (now < entitlement.validFrom || now > validUntil) {
      return {
        valid: true,
        message: "entitlement is expired",
      }
    }

    return {
      valid: false,
      message: "entitlement is valid",
    }
  }

  private isValidEntitlement(featureSlug: string) {
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
    forceRevalidate = false,
  }: {
    customerId: string
    projectId: string
    featureSlug: string
    now: number
    forceRevalidate?: boolean
  }): Promise<{
    success: boolean
    message: string
  }> {
    const verification = await this.db.select().from(verifications)

    console.info("verification", verification)

    const shouldRevalidateEntitlement = this.shouldRevalidateEntitlement(featureSlug)

    if (!shouldRevalidateEntitlement.valid && !forceRevalidate) {
      return {
        success: false,
        message: shouldRevalidateEntitlement.message,
      }
    }

    const entitlement = await this.unpriceDb
      .select({
        customerEntitlement: customerEntitlements,
        featureType: planVersionFeatures.featureType,
        planVersionFeatureId: planVersionFeatures.id,
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
          lteUnprice(customerEntitlements.validFrom, now),
          gteUnprice(customerEntitlements.validTo, now)
        )
      )
      .then((e) => e[0])
      .catch((e) => {
        // TODO: log it
        console.error("error getting entitlement", e)
        return null
      })

    if (
      !entitlement ||
      !entitlement.featureType ||
      !entitlement.planVersionFeatureId ||
      !entitlement.aggregationMethod
    ) {
      return {
        success: false,
        message: "entitlement not found in unprice db",
      }
    }

    const {
      customerEntitlement: activeEntitlement,
      featureType,
      planVersionFeatureId,
      aggregationMethod,
    } = entitlement

    if (!activeEntitlement) {
      return {
        success: false,
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

    const usage =
      totalUsage === 0
        ? 0
        : (totalUsage[entitlement.aggregationMethod as keyof typeof totalUsage] ?? 0)

    const accumulatedUsage =
      totalAccumulatedUsage === 0
        ? 0
        : (totalAccumulatedUsage[
            entitlement.aggregationMethod as keyof typeof totalAccumulatedUsage
          ] ?? 0)

    const entitlementDo = {
      entitlementId: activeEntitlement.id,
      customerId: activeEntitlement.customerId,
      projectId: activeEntitlement.projectId,
      validFrom: activeEntitlement.validFrom,
      validTo: activeEntitlement.validTo,
      featureSlug: featureSlug,
      aggregationMethod: aggregationMethod,
      bufferPeriodDays: activeEntitlement.bufferPeriodDays,
      featureType: featureType,
      usage: usage.toString(),
      accumulatedUsage: accumulatedUsage.toString(),
      limit: activeEntitlement.limit,
      lastUsageUpdateAt: Date.now(),
      subscriptionItemId: activeEntitlement.subscriptionItemId,
      subscriptionPhaseId: activeEntitlement.subscriptionPhaseId,
      subscriptionId: activeEntitlement.subscriptionId,
      resetedAt: activeEntitlement.resetedAt,
      planVersionFeatureId: planVersionFeatureId,
    }

    // insert or update the entitlement in the db
    const result = await this.db
      .insert(entitlements)
      .values(entitlementDo)
      .onConflictDoUpdate({
        target: entitlements.id,
        set: {
          ...entitlementDo,
        },
      })
      .returning()
      .then((e) => e[0])

    if (!result) {
      return {
        success: false,
        message: "failed to update entitlement in db",
      }
    }

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
            eqUnprice(customerEntitlements.id, entitlementDo.entitlementId),
            eqUnprice(customerEntitlements.customerId, entitlementDo.customerId),
            eqUnprice(customerEntitlements.projectId, entitlementDo.projectId)
          )
        )
    )

    this.featuresUsage.set(entitlementDo.featureSlug, result)

    return {
      success: true,
      message: "entitlement revalidated",
    }
  }

  async getEntitlement(featureSlug: string): Promise<Entitlement | null> {
    const entitlement = this.featuresUsage.get(featureSlug)

    if (!entitlement) {
      return null
    }

    return entitlement
  }

  private async getUsageFromAnalytics({
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
