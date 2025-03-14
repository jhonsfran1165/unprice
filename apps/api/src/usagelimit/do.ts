import { type Connection, type ConnectionContext, Server } from 'partyserver'

import { type DrizzleSqliteDODatabase, drizzle } from 'drizzle-orm/durable-sqlite'
import { migrate } from 'drizzle-orm/durable-sqlite/migrator'
import migrations from '../../drizzle/migrations'

import type { Env } from '../env'
import type { LimitRequest, LimitResponse, RevalidateRequest } from './interface'

import type { Tinybird } from '@chronark/zod-bird'
import { inArray, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { createTinyClient, eventSchema } from '../analytics'
import { usageRecords } from '../db/schema'

type CurrentUsage = {
  projectId: string
  customerId: string
  entitlementId: string
  featureSlug: string
  count: number
  sum: number
  max: number
  last_during_period: number
}

type UsageRecord = {
  subscriptionItemId: string
  subscriptionPhaseId: string
  subscriptionId: string
  entitlementId: string
  featureSlug: string
  customerId: string
  timestamp: number
  projectId: string
  planVersionFeatureId: string
  usage: number
  createdAt: number
  workspaceId: string
  requestId: string
  deleted: boolean
  metadata: string
}

type Usage = Record<string, number>
export class DurableObjectUsagelimiter extends Server {
  private initialized = false
  // revalidate every 60 seconds
  private lastRevalidate = 0
  private lastBroadcastTime = 0
  private usage: Usage = {}
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private db: DrizzleSqliteDODatabase<any>
  private storage: DurableObjectStorage
  private tinybird: Tinybird
  private readonly TTL = 1000 * 10 // 10 secs
  private api = new Hono()
  private readonly DEBOUNCE_DELAY = 1000 // Minimum time between broadcasts

  static options = {
    hibernate: true,
  }

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)

    this.storage = ctx.storage
    this.db = drizzle(this.storage, { logger: false })
    this.tinybird = createTinyClient(env.TINYBIRD_TOKEN, env.TINYBIRD_URL)

    // block concurrency while initializing
    this.ctx.blockConcurrencyWhile(async () => {
      // migrate first
      await this._migrate()
      // set initial usage
      try {
        const usage = await this.db
          .select({
            customerId: usageRecords.customerId,
            featureSlug: usageRecords.featureSlug,
            sum: sql<number>`sum(${usageRecords.usage})`,
          })
          .from(usageRecords)
          .groupBy(usageRecords.customerId, usageRecords.featureSlug)

        this.usage = usage.reduce((acc, curr) => {
          acc[curr.featureSlug] = curr.sum ?? 0
          return acc
        }, {} as Usage)
      } catch (e) {
        console.error('error getting usage', e)
        this.usage = {}
      }
    })
  }

  async _migrate() {
    migrate(this.db, migrations)
  }

  async getInitialUsageTinybird() {
    const events = await this.db
      .select()
      .from(usageRecords)
      .where(sql`timestamp > ${Date.now() - this.TTL}`)
  }

  async reportUsage(req: LimitRequest): Promise<LimitResponse> {
    // get the alarm
    const alarm = await this.ctx.storage.getAlarm()

    // if there is no alarm set one given the ttl header
    if (!alarm) {
      const ttl = req.ttl || this.TTL

      if (ttl > 0) {
        this.ctx.storage.setAlarm(Date.now() + ttl)
      }
    }

    // insert usage into db
    await this.db.insert(usageRecords).values({
      customerId: req.customerId,
      featureSlug: req.featureSlug,
      usage: req.usage,
      timestamp: Date.now(),
    })

    // update usage
    if (!this.usage[req.featureSlug]) {
      this.usage[req.featureSlug] = req.usage
    } else {
      this.usage[req.featureSlug] += req.usage
    }

    const now = Date.now()

    // Only broadcast if enough time has passed since last broadcast
    if (now - this.lastBroadcastTime >= this.DEBOUNCE_DELAY) {
      this.broadcast(
        JSON.stringify({
          customerId: req.customerId,
          featureSlug: req.featureSlug,
          usage: req.usage,
          timestamp: now,
        }),
      )
      this.lastBroadcastTime = now
    }

    // return usage
    return {
      valid: true,
      remaining: 100,
      usage: this.usage,
    }
  }

  onStart(): void | Promise<void> {
    console.log('onStart')
  }

  onConnect(connection: Connection, ctx: ConnectionContext): void | Promise<void> {
    console.log('onConnect')
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
        // Use a combination of customerId, featureSlug, and timestamp for deduplication
        const key = `${event.customerId}-${event.featureSlug}-${event.timestamp}`
        if (!uniqueEvents.has(key)) {
          uniqueEvents.set(key, event)
        }
      }

      const deduplicatedEvents = Array.from(uniqueEvents.values())
      const ids = deduplicatedEvents.map((e) => e.id)

      if (deduplicatedEvents.length > 0) {
        try {
          const ingest = this.tinybird.buildIngestEndpoint({
            datasource: 'events__v1',
            event: eventSchema,
            wait: true, // wait for confirmation from tinybird
          })

          await ingest(deduplicatedEvents)
          // Only delete events that were successfully sent
          await this.db.delete(usageRecords).where(inArray(usageRecords.id, ids))
          processedCount += ids.length
        } catch (error) {
          console.error('Failed to send events to Tinybird:', error)
          // Don't delete events if sending failed
          // We'll try again in the next alarm
          break
        }
      }

      // Update the last processed ID for the next batch
      lastProcessedId = events[events.length - 1].id
    }

    // Log processing statistics
    console.log(`Processed ${processedCount} events in this batch`)
  }

  // websocket message handler
  async onMessage(conn: Connection, message: string) {
    const { type, userId, profile } = JSON.parse(message)

    switch (type) {
      case 'get':
        conn.send(
          JSON.stringify({
            type: 'profile',
            data: this.usage,
            usage: this.usage,
          }),
        )
        break

      case 'update':
        this.broadcast(
          JSON.stringify({
            type: 'profile_updated',
            profile: profile,
            usage: this.usage,
          }),
        )
        break
    }
  }

  // revalidate if needed
  async revalidate(req: RevalidateRequest): Promise<void> {
    this.lastRevalidate = Date.now()
  }

  async onAlarm(): Promise<void> {
    // send usage to tinybird on alarm
    await this.sendToTinybird()
  }
}
