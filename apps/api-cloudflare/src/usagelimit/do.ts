import { type Connection, Server } from "partyserver"

import type { Env } from "~/env"

import type { CustomerEntitlement } from "@unprice/db/validators"
import { Analytics } from "@unprice/tinybird"

export class DurableObjectUsagelimiter extends Server {
  private entitlement: CustomerEntitlement
  private revalidateUntil = 0
  private revalidationRetries = 0
  private currentUsage: number
  private accumulatedUsage: number
  private initialized = false
  private analytics: Analytics

  static options = {
    hibernate: true, // hibernate the do when idle
  }

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)

    this.entitlement = {} as CustomerEntitlement
    this.currentUsage = 0
    this.accumulatedUsage = 0

    this.analytics = new Analytics({
      emit: env.EMIT_METRICS_LOGS,
      tinybirdToken: env.TINYBIRD_TOKEN,
      tinybirdUrl: env.TINYBIRD_URL,
    })
  }

  async isValidEntitlement(entitlement: CustomerEntitlement) {
    const gracePeriod = entitlement.gracePeriod
    const currentCycleEndAt = entitlement.currentCycleEndAt
    const currentCycleStartAt = entitlement.currentCycleStartAt
    const featureType = entitlement.featureType
    const now = Date.now()

    // validate feature type
    // flat features shouldn't be used with usage limit
    if (featureType === "flat") {
      return
    }

    // validate is the billing cycle is active, add the grace period to the end of the cycle
    // grace period is in days, so we need to convert it to milliseconds
    const gracePeriodInMs = gracePeriod * 24 * 60 * 60 * 1000
    const endOfCycle = currentCycleEndAt + gracePeriodInMs

    if (now < currentCycleStartAt || now > endOfCycle) {
      // TODO: log this error
      console.error("error getting usage", "billing cycle not active")
      return false
    }

    return true
  }

  // this validation should happen in the client so the durable object is not responsible for it
  // also we avoid calling the DO for every entitlement but still we need to validate the entitlement
  async startup({
    entitlement,
  }: {
    entitlement: CustomerEntitlement
  }) {
    // block concurrency while initializing
    this.ctx.blockConcurrencyWhile(async () => {
      try {
        const currentCycleEndAt = entitlement.currentCycleEndAt
        const currentCycleStartAt = entitlement.currentCycleStartAt

        const isValid = await this.isValidEntitlement(entitlement)

        if (!isValid) {
          return
        }

        if (this.initialized) {
          return
        }

        const isAccumulated = entitlement.aggregationMethod.endsWith("_all")

        if (!isAccumulated) {
          const totalUsage = await this.analytics
            .getFeaturesUsagePeriod({
              customerId: entitlement.customerId,
              entitlementId: entitlement.id,
              projectId: entitlement.projectId,
              start: currentCycleStartAt,
              end: Date.now(), // get the usage for the current cycle
            })
            .then((usage) => usage.data[0])
            .catch((error) => {
              // TODO: log this error
              console.error("error getting usage", error)

              return null
            })

          if (!totalUsage) {
            this.currentUsage = 0
          } else {
            const usage =
              (totalUsage[entitlement.aggregationMethod as keyof typeof totalUsage] as number) ?? 0
            this.currentUsage = usage
          }

          this.accumulatedUsage = 0
        } else {
          // get the total usage and the usage for the current cycle when the entitlement is accumulated
          const [totalAccumulatedUsage, totalUsage] = await Promise.all([
            this.analytics
              .getFeaturesUsageTotal({
                customerId: this.entitlement.customerId,
                projectId: this.entitlement.projectId,
                entitlementId: entitlement.id,
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
                entitlementId: entitlement.id,
                projectId: entitlement.projectId,
                start: currentCycleStartAt,
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
            this.currentUsage = 0
          } else {
            const usage =
              (totalUsage[entitlement.aggregationMethod as keyof typeof totalUsage] as number) ?? 0
            this.currentUsage = usage
          }

          if (!totalAccumulatedUsage) {
            this.accumulatedUsage = 0
          } else {
            const usage =
              (totalAccumulatedUsage[
                entitlement.aggregationMethod as keyof typeof totalAccumulatedUsage
              ] as number) ?? 0
            this.accumulatedUsage = usage
          }

          this.currentUsage = 0
        }

        // grace period is in days, so we need to convert it to milliseconds
        const gracePeriodInMs = entitlement.gracePeriod * 24 * 60 * 60 * 1000
        const endOfCycle = currentCycleEndAt + gracePeriodInMs

        this.initialized = true
        this.entitlement = entitlement
        this.revalidateUntil = endOfCycle

        // get the alarm
        const alarm = await this.ctx.storage.getAlarm()

        // set an alarm to revalidate the entitlement on the end of the cycle
        if (!alarm) {
          if (currentCycleEndAt > 0) {
            // set an alarm 1 hour after the end of the cycle to revalidate the entitlement
            this.ctx.storage.setAlarm(currentCycleEndAt + 1000 * 60 * 60 * 1)
          }
        }
      } catch (error) {
        console.error("error initializing", error)
        this.initialized = false
      }
    })
  }

  onStart(): void | Promise<void> {
    console.info("onStart")
  }

  onConnect(): void | Promise<void> {
    console.info("onConnect")
  }

  // websocket message handler
  async onMessage(conn: Connection, message: string) {
    const { type, profile } = JSON.parse(message)

    switch (type) {
      case "get":
        conn.send(
          JSON.stringify({
            type: "profile",
            data: this.currentUsage,
            usage: this.accumulatedUsage,
          })
        )
        break

      case "update":
        this.broadcast(
          JSON.stringify({
            type: "profile_updated",
            profile: profile,
            usage: this.currentUsage,
          })
        )
        break
    }
  }

  // revalidate if needed
  async revalidate(): Promise<void> {
    // add bd call for getting the entitlement
    this.entitlement = this.entitlement

    // validate the entitlement
    const isValid = await this.isValidEntitlement(this.entitlement)

    if (!isValid) {
      // log error
      console.error("error revalidating", "invalid entitlement")

      // set another alarm to revalidate in 1 hour
      this.ctx.storage.setAlarm(Date.now() + 1000 * 60 * 60 * 1)
      // add a retry
      this.revalidationRetries++

      return
    }

    this.initialized = false
    this.startup({ entitlement: this.entitlement })
  }

  async onAlarm(): Promise<void> {
    if (!this.initialized) {
      return
    }

    // avoid infinite retries
    if (this.revalidationRetries > 50) {
      // log error
      console.error("error revalidating", "retries limit reached")

      return
    }

    if (this.revalidateUntil < Date.now()) {
      // on alarm revalidate the entitlement
      await this.revalidate()
    }

    // log the revalidation time
  }
}
