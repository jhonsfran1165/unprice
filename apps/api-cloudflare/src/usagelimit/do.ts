import { type Connection, Server } from "partyserver"

import type { Env } from "~/env"

import type { CustomerEntitlement } from "@unprice/db/validators"
import { Analytics } from "@unprice/tinybird"

export class DurableObjectUsagelimiter extends Server {
  private analytics: Analytics
  private state: DurableObjectState

  static options = {
    hibernate: true, // hibernate the do when idle
  }

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)

    this.state = ctx

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

  async setUsage(usage: number, type: "current" | "accumulated") {
    if (type === "current") {
      this.state.storage.put("currentUsage", usage)
    } else {
      this.state.storage.put("accumulatedUsage", usage)
    }
  }

  async getUsage(type: "current" | "accumulated") {
    if (type === "current") {
      return (await this.state.storage.get("currentUsage")) as number
    }

    return (await this.state.storage.get("accumulatedUsage")) as number
  }

  async incrementUsage(usage: number, type: "current" | "accumulated") {
    if (type === "current") {
      const currentUsage = await this.getUsage("current")
      this.state.storage.put("currentUsage", currentUsage + usage)
    } else {
      const accumulatedUsage = await this.getUsage("accumulated")
      this.state.storage.put("accumulatedUsage", accumulatedUsage + usage)
    }
  }

  async setEntitlement(entitlement: CustomerEntitlement) {
    this.state.storage.put("entitlement", entitlement)
  }

  async getEntitlement() {
    return (await this.state.storage.get("entitlement")) as CustomerEntitlement
  }
  // this validation should happen in the client so the durable object is not responsible for it
  // also we avoid calling the DO for every entitlement but still we need to validate the entitlement
  async startup({
    entitlement,
  }: {
    entitlement: CustomerEntitlement
  }) {
    const featureType = entitlement.featureType

    // flat features shouldn't be used with usage limit
    if (featureType === "flat") {
      return
    }

    // block concurrency while initializing
    this.ctx.blockConcurrencyWhile(async () => {
      try {
        const currentCycleEndAt = entitlement.currentCycleEndAt
        const currentCycleStartAt = entitlement.currentCycleStartAt

        const isValid = await this.isValidEntitlement(entitlement)

        if (!isValid) {
          return
        }

        const initialized = (await this.state.storage.get("initialized")) as boolean

        if (initialized) {
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
            await this.setUsage(0, "current")
          } else {
            const usage =
              (totalUsage[entitlement.aggregationMethod as keyof typeof totalUsage] as number) ?? 0
            await this.setUsage(usage, "current")
          }

          await this.setUsage(0, "accumulated")
        } else {
          // get the total usage and the usage for the current cycle when the entitlement is accumulated
          const [totalAccumulatedUsage, totalUsage] = await Promise.all([
            this.analytics
              .getFeaturesUsageTotal({
                customerId: entitlement.customerId,
                projectId: entitlement.projectId,
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
            await this.setUsage(0, "current")
          } else {
            const usage =
              (totalUsage[entitlement.aggregationMethod as keyof typeof totalUsage] as number) ?? 0
            await this.setUsage(usage, "current")
          }

          if (!totalAccumulatedUsage) {
            await this.setUsage(0, "accumulated")
          } else {
            const usage =
              (totalAccumulatedUsage[
                entitlement.aggregationMethod as keyof typeof totalAccumulatedUsage
              ] as number) ?? 0
            await this.setUsage(usage, "accumulated")
          }
        }

        // grace period is in days, so we need to convert it to milliseconds
        const gracePeriodInMs = entitlement.gracePeriod * 24 * 60 * 60 * 1000
        const endOfCycle = currentCycleEndAt + gracePeriodInMs

        await this.state.storage.put("initialized", true)
        await this.state.storage.put("entitlement", entitlement)
        await this.state.storage.put("revalidateUntil", endOfCycle)

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
        await this.state.storage.put("initialized", false)
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
    const currentUsage = await this.getUsage("current")
    const accumulatedUsage = await this.getUsage("accumulated")

    switch (type) {
      case "get":
        conn.send(
          JSON.stringify({
            type: "profile",
            data: currentUsage,
            usage: accumulatedUsage,
          })
        )
        break

      case "update":
        this.broadcast(
          JSON.stringify({
            type: "profile_updated",
            profile: profile,
            usage: currentUsage,
          })
        )
        break
    }
  }

  // revalidate if needed
  async revalidate(): Promise<void> {
    // add bd call for getting the entitlement
    const entitlement = await this.getEntitlement()

    // validate the entitlement
    const isValid = await this.isValidEntitlement(entitlement)

    if (!isValid) {
      // log error
      console.error("error revalidating", "invalid entitlement")

      // set another alarm to revalidate in 1 hour
      this.ctx.storage.setAlarm(Date.now() + 1000 * 60 * 60 * 1)
      // add a retry
      const retries = (await this.state.storage.get("revalidationRetries")) as number | 0
      await this.state.storage.put("revalidationRetries", retries + 1)

      return
    }

    const initialized = (await this.state.storage.get("initialized")) as boolean
    if (!initialized) {
      await this.startup({ entitlement })
    }
  }

  async onAlarm(): Promise<void> {
    const initialized = (await this.state.storage.get("initialized")) as boolean
    if (!initialized) {
      return
    }

    // avoid infinite retries
    const retries = (await this.state.storage.get("revalidationRetries")) as number | 0
    if (retries > 50) {
      // log error
      console.error("error revalidating", "retries limit reached")

      return
    }

    const revalidateUntil = (await this.state.storage.get("revalidateUntil")) as number
    if (revalidateUntil < Date.now()) {
      // on alarm revalidate the entitlement
      await this.revalidate()
    }

    // log the revalidation time
  }
}
