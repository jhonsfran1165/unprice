import { logger, schedules } from "@trigger.dev/sdk/v3"
import { and, db, eq, gte } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { createSubscriptionDB } from "@unprice/db/validators"
import { addDays } from "date-fns"

export const endTrialsTask = schedules.task({
  id: "billing.end.trials",
  //every two hours (UTC timezone)
  // cron: "0 */2 * * *",
  // every 12 hours (UTC timezone)
  cron: "0 */12 * * *",
  run: async (_payload) => {
    const now = new Date("2024-11-01T00:00:00.000Z").getTime()

    // the Idea here is to change the status of the subscription once they are no longer in trial
    // and depending on the planConfiguration, we either downgrade the plan or cancel the subscription

    // find all those subscriptions that are currently in trial and the trial ends at is in the past
    const subscriptions = await db
      .select({
        subscription: schema.subscriptions,
        planVersion: schema.versions,
        customer: schema.customers,
      })
      .from(schema.subscriptions)
      .innerJoin(schema.projects, and(eq(schema.subscriptions.projectId, schema.projects.id)))
      .innerJoin(
        schema.versions,
        and(
          eq(schema.subscriptions.planVersionId, schema.versions.id),
          eq(schema.subscriptions.projectId, schema.versions.projectId)
        )
      )
      .innerJoin(schema.customers, eq(schema.subscriptions.customerId, schema.customers.id))
      .where(
        and(
          eq(schema.subscriptions.status, "trialing"),
          gte(schema.subscriptions.trialEndsAt, now),
          eq(schema.subscriptions.active, true)
        )
      )

    for (const subscription of subscriptions) {
      const sub = subscription.subscription
      const planVersion = subscription.planVersion
      const customer = subscription.customer

      // if the plan is in grace period, we need to wait until the grace period ends
      const gracePeriodEndsAt = addDays(sub.billingCycleEndAt, sub.gracePeriod).getTime()

      // if the plan requires a payment method, but at this point the customer does not have one yet
      // we downgrade the plan to the default plan
      const requiredPaymentMethod = planVersion.paymentMethodRequired
      let hasPaymentMethod = ""

      const paymentProvider = planVersion.paymentProvider

      if (paymentProvider === "stripe") {
        hasPaymentMethod = customer.metadata?.stripeDefaultPaymentMethodId ?? ""
      }

      // if the plan needs a payment method and the customer does not have one yet
      // we need to find the default plan and change the subscription to pending payment method
      // and downgrade the plan to the default plan
      if (requiredPaymentMethod && hasPaymentMethod !== "") {
        // lets wait until the grace period ends
        if (gracePeriodEndsAt > Date.now()) {
          logger.info(`Grace period ends at ${gracePeriodEndsAt} for subscription ${sub.id}`)

          // set status to identifying later on
          // TODO: I could change the status to past_due or something like that
          // and let the past_due job to handle the downgrading
          await db
            .update(schema.subscriptions)
            .set({
              status: "past_due",
              pastDueAt: gracePeriodEndsAt,
              metadata: {
                reason: "trials_ended",
                note: "Waiting for payment method",
              },
            })
            .where(eq(schema.subscriptions.id, sub.id))
          continue
        }

        // TODO: past_due job should handle this --->
        // now we query the latest default plan version
        const defaultPlanVersion = await db.query.plans
          .findFirst({
            where(fields, operators) {
              return operators.and(
                operators.eq(fields.projectId, sub.projectId),
                operators.eq(fields.active, true),
                operators.eq(fields.defaultPlan, true)
              )
            },
            with: {
              versions: {
                where(fields, operators) {
                  return operators.and(
                    operators.eq(fields.active, true),
                    operators.eq(fields.status, "published"),
                    operators.eq(fields.latest, true)
                  )
                },
              },
            },
          })
          .then((plans) => plans?.versions[0])

        if (!defaultPlanVersion) {
          logger.error(`Default plan not found for project ${sub.projectId}`)
          continue
        }

        // this should be a transaction
        await db.transaction(async (trx) => {
          // create a new subscription with the default plan
          const result = await createSubscriptionDB({
            projectId: sub.projectId,
            subscription: {
              ...sub,
              planVersionId: defaultPlanVersion.id,
              trialDays: 0,
              startAt: Date.now(),
              metadata: {
                reason: "trials_ended",
                note: "no payment method provided after grace period",
              },
            },
            db: trx,
          })

          if (result.err) {
            logger.error(`Error while creating subscription ${result.err}`)
            trx.rollback()
            return
          }

          // downgrade the plan to the default plan
          await trx
            .update(schema.subscriptions)
            .set({
              status: "changed",
              endAt: Date.now(),
              changeAt: Date.now(),
              nextSubscriptionId: result.val.id,
              nextPlanVersionId: defaultPlanVersion.id,
              active: false,
              metadata: {
                reason: "grace_period",
                note: "Grace period ended, downgrading to default plan",
              },
            })
            .where(eq(schema.subscriptions.id, sub.id))

          return {
            subscriptionId: result.val.id,
          }
        })
        // <---
        continue
      }

      // here we should be able to bill the subscription because the customer has a payment method
      // TODO: execute a billing job from here with the current date
      logger.error(`Plan version ${planVersion.id} has no billing period`)
    }

    logger.info(`Found ${subscriptions.length} subscriptions`)

    return {
      message: "Hello, world!",
      subscriptionIds: subscriptions.map((s) => s.subscription.id),
    }
  },
})
