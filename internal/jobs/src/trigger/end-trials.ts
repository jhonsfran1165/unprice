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
        and(eq(schema.subscriptions.status, "trialing"), gte(schema.subscriptions.trialEndsAt, now))
      )

    for (const subscription of subscriptions) {
      const sub = subscription.subscription
      const planVersion = subscription.planVersion
      const customer = subscription.customer

      const requiredPaymentMethod = planVersion.paymentMethodRequired
      // TODO: the payment provider could be different than stripe
      const hasPaymentMethod =
        sub.defaultPaymentMethodId ?? customer.metadata?.stripeDefaultPaymentMethodId

      const gracePeriodEndsAt = addDays(Date.now(), sub.gracePeriod).getTime()

      // if the plan needs a payment method and the customer does not have one yet
      // we need to find the default plan and change the subscription to pending payment method
      // and downgrade the plan to the default plan
      if (requiredPaymentMethod && !hasPaymentMethod) {
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
                lastChangePlanAt: Date.now(),
                reason: "trials_ended",
                note: "Trials ended, downgrading to default plan because payment method not found",
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
              endAt: gracePeriodEndsAt,
              nextSubscriptionId: result.val.id,
              nextPlanVersionId: defaultPlanVersion.id,
              metadata: {
                ...sub.metadata,
                reason: "trials_ended",
                note: "Trials ended, downgrading to default plan",
                requestActionAt: Date.now(),
              },
            })
            .where(eq(schema.subscriptions.id, sub.id))

          return {
            subscriptionId: result.val.id,
          }
        })

        continue
      }

      if (!planVersion.billingPeriod) {
        logger.error(`Plan version ${planVersion.id} has no billing period`)
        continue
      }

      // here we should be able to bill the subscription
      logger.error(`Plan version ${planVersion.id} has no billing period`)
    }

    logger.info(`Found ${subscriptions.length} subscriptions`)

    return {
      message: "Hello, world!",
      subscriptionIds: subscriptions.map((s) => s.subscription.id),
    }
  },
})
