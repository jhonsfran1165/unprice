import { logger, task } from "@trigger.dev/sdk/v3"
import { db, eq } from "@unprice/db"
import { subscriptionChanges, subscriptionItems, subscriptions } from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"

export const applySubscriptionChangeTask = task({
  id: "apply.subscription.change",
  run: async ({
    subscriptionChangeId,
    date,
  }: {
    subscriptionChangeId: string
    date: number
  }) => {
    // find the subscription change
    const subscriptionChange = await db.query.subscriptionChanges.findFirst({
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.id, subscriptionChangeId),
          operators.lte(fields.changeAt, date)
        )
      },
      with: {
        subscription: {
          with: {
            items: true,
          },
        },
        itemsChanges: true,
      },
    })

    if (!subscriptionChange) {
      logger.error(
        `Subscription change ${subscriptionChangeId} not found or it should not be applied at this time`
      )
      return
    }

    if (!["changing"].includes(subscriptionChange.status)) {
      logger.info(
        `Subscription change ${subscriptionChangeId} has a status that cannot be applied ${subscriptionChange.status}`
      )
      return
    }

    // check if the subscription was already canceled
    if (subscriptionChange.status === "applied") {
      logger.info(`Subscription change ${subscriptionChangeId} is already applied`)
      return
    }

    // this is the tricky part, we need to apply the change to the subscription but in order to do that
    // we need to handle the proration and the billing of the subscription
    // we invoice the subscription and invoicing job should handle the proration when there was a change in the plan

    // we need to update the subscription change status to applied
    await db
      .update(subscriptionChanges)
      .set({ status: "applied", appliedAt: date })
      .where(eq(subscriptionChanges.id, subscriptionChangeId))

    // we need to apply the change to the subscription items
    const itemsChanges = subscriptionChange.itemsChanges

    for (const itemChange of itemsChanges) {
      if (itemChange.changeType === "add") {
        // we need to add the new items to the subscription
        await db.insert(subscriptionItems).values({
          id: newId("subscription_item"),
          projectId: subscriptionChange.projectId,
          subscriptionId: subscriptionChange.subscriptionId,
          featurePlanVersionId: itemChange.newFeaturePlanVersionId,
          units: itemChange.newUnits,
        })
      } else if (itemChange.changeType === "remove") {
        // we need to remove the items from the subscription
        await db
          .delete(subscriptionItems)
          .where(eq(subscriptionItems.id, itemChange.subscriptionItemId ?? ""))
      } else if (itemChange.changeType === "update") {
        // we need to update the items of the subscription
        await db
          .update(subscriptionItems)
          .set({
            featurePlanVersionId: itemChange.newFeaturePlanVersionId,
            units: itemChange.newUnits,
          })
          .where(eq(subscriptionItems.id, itemChange.subscriptionItemId ?? ""))
      }
    }

    // we update the subscription plan and status
    await db
      .update(subscriptions)
      .set({ planVersionId: subscriptionChange.newPlanVersionId, status: "active", changeAt: date })
      .where(eq(subscriptions.id, subscriptionChange.subscriptionId))

    // the invoice will be created by the invoicing job as normal no to trigger manually
    return {
      success: true,
    }
  },
})
