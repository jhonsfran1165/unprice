import { logger, task } from "@trigger.dev/sdk/v3"
import { db, eq } from "@unprice/db"
import { subscriptionChanges, subscriptionItemChanges, subscriptions } from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"
import {
  type PlanVersionExtended,
  type SubscriptionItemConfig,
  type SubscriptionItemsConfig,
  createDefaultSubscriptionConfig,
} from "@unprice/db/validators"
import { applySubscriptionChangeTask } from "./apply-subscription-change"

export const createSubscriptionChangeTask = task({
  id: "create.subscription.change",
  run: async ({
    subscriptionId,
    newPlanVersionId,
    date,
    changeType,
    whenToApply = "endperiod",
    config,
  }: {
    subscriptionId: string
    newPlanVersionId?: string
    date: number
    whenToApply: "inmidiate" | "endperiod"
    changeType: "downgrade" | "upgrade"
    config?: SubscriptionItemsConfig
  }) => {
    // the main idea with this task is creating the subscription change for the subscription
    // we receive the subscription, the new plan and when to change it. Optionally we receive
    // if the change should be applied immediately or at the end of the period, and the config for the new subscription items
    // if no new plan version is passed we get the latest default one for the project

    // TODO: idempotency key is the subscription id and the new plan version id
    // const idempotencyKey = idempotencyKeys.create(`${subscriptionId}-${newPlanVersionId}`)

    // TODO: handle errors properly https://trigger.dev/docs/errors-retrying

    // get the subscription
    const subscription = await db.query.subscriptions.findFirst({
      where(fields, operators) {
        return operators.and(operators.eq(fields.id, subscriptionId))
      },
      with: {
        items: true,
      },
    })

    if (!subscription) {
      logger.error(`Subscription ${subscriptionId} not found`)
      return {
        success: false,
        error: `Subscription ${subscriptionId} not found`,
      }
    }

    // if the subscription is not active we cannot apply the change
    if (!["active", "trialing"].includes(subscription.status)) {
      logger.error(
        `Subscription ${subscription.id} has a status that cannot be changed ${subscription.status}`
      )
      return {
        success: false,
        error: `Subscription ${subscription.id} has a status that cannot be changed ${subscription.status}`,
      }
    }

    if (whenToApply) {
      // TODO: delete this
      return {
        success: true,
      }
    }

    // if the new plan version is not provided, we need to find the latest default one for the project
    let newPlanVersion: PlanVersionExtended

    if (!newPlanVersionId) {
      const defaultPlanVersion = await db.query.plans
        .findFirst({
          where(fields, operators) {
            return operators.and(
              operators.eq(fields.projectId, subscription.projectId),
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
              with: {
                planFeatures: {
                  with: {
                    feature: true,
                  },
                },
                plan: true,
              },
            },
          },
        })
        .then((res) => {
          // get the first version (should be only one)
          return res?.versions[0]
        })

      if (!defaultPlanVersion) {
        logger.error(`No default plan version found for project ${subscription.projectId}`)
        return {
          success: false,
          error: `No default plan version found for the project ${subscription.projectId}`,
        }
      }

      newPlanVersion = defaultPlanVersion
    } else {
      const planVersion = await db.query.versions.findFirst({
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.id, newPlanVersionId),
            operators.eq(fields.projectId, subscription.projectId)
          )
        },
        with: {
          planFeatures: {
            with: {
              feature: true,
            },
          },
          plan: true,
        },
      })

      if (!planVersion) {
        logger.error(`No plan version found for project ${subscription.projectId}`)
        return {
          success: false,
          error: `No plan version found with id ${newPlanVersionId} for project ${subscription.projectId}`,
        }
      }

      newPlanVersion = planVersion
    }

    // we create the subscription items for the new plan version
    let configItemsSubscription: SubscriptionItemConfig[] = []

    if (!config) {
      // if no items are passed, configuration is created from the default quantities of the plan version
      const { err, val } = createDefaultSubscriptionConfig({
        planVersion: newPlanVersion,
      })

      if (err) {
        logger.error(`Error creating default subscription config: ${err.message}`)
        return {
          success: false,
          error: `Error creating default subscription config: ${err.message}`,
        }
      }

      configItemsSubscription = val
    } else {
      configItemsSubscription = config
    }

    // create the subscription change from now we execute all changes in a transaction
    const subscriptionChange = await db.transaction(async (tx) => {
      // create the subscription change first
      const subscriptionChange = await tx
        .insert(subscriptionChanges)
        .values({
          id: newId("subscription_change"),
          subscriptionId,
          projectId: subscription.projectId,
          newPlanVersionId: newPlanVersion.id,
          changeType,
          previousPlanVersionId: subscription.planVersionId,
          // TODO: we should apply inmidiate or at the end of the period based on the immediate parameter
          changeAt: date,
          status: "pending",
        })
        .returning()
        .catch((err) => {
          logger.error(`Error creating subscription change ${err.message}`)
          return undefined
        })
        .then((res) => res?.[0])

      if (!subscriptionChange) {
        logger.error("Error creating subscription change")
        return {
          success: false,
          error: "Error creating subscription change",
        }
      }

      // create the subscription change items
      // here we compare the new plan version with the old one and create the subscription change items
      // for items that are already present we create the item change with the new units as type update
      // for items that are not present we create the item change with type add
      // for items that are present in the old plan version but not in the new one we create the item change with type remove
      // be mindfull that the new plan version can have less items than the old one
      // every item at the end should have a change item so we can know the whole history of the subscription

      const currentItems = subscription.items

      // first we add the items that are not present in the new plan version as type remove
      for (const item of currentItems) {
        if (!configItemsSubscription.find((i) => i.featurePlanId === item.featurePlanVersionId)) {
          await db.insert(subscriptionItemChanges).values({
            id: newId("subscription_change_item"),
            subscriptionChangeId: subscriptionChange.id,
            projectId: subscription.projectId,
            subscriptionItemId: item.id,
            newFeaturePlanVersionId: null,
            previousFeaturePlanVersionId: item.featurePlanVersionId,
            previousUnits: item.units,
            newUnits: 0,
            changeType: "remove",
            changeAt: date,
            status: "pending",
          })
        }
      }

      // then we add the items that are present in the new plan version as type update or add
      for (const item of configItemsSubscription) {
        const itemExisting = currentItems.find((i) => i.featurePlanVersionId === item.featurePlanId)

        if (itemExisting) {
          await db.insert(subscriptionItemChanges).values({
            id: newId("subscription_change_item"),
            subscriptionChangeId: subscriptionChange.id,
            subscriptionItemId: itemExisting.id,
            newFeaturePlanVersionId: item.featurePlanId,
            projectId: subscription.projectId,
            previousFeaturePlanVersionId: itemExisting.featurePlanVersionId,
            previousUnits: itemExisting.units,
            newUnits: item.units,
            changeType: "update",
            changeAt: date,
            status: "pending",
          })
        } else {
          await db.insert(subscriptionItemChanges).values({
            id: newId("subscription_change_item"),
            subscriptionChangeId: subscriptionChange.id,
            subscriptionItemId: null,
            newFeaturePlanVersionId: item.featurePlanId,
            projectId: subscription.projectId,
            previousFeaturePlanVersionId: null,
            changeType: "add",
            changeAt: date,
            status: "pending",
          })
        }
      }

      // update the subscription with the changing status so it's locked for other changes
      await db
        .update(subscriptions)
        .set({ status: "changing", changeAt: date })
        .where(eq(subscriptions.id, subscriptionId))

      return {
        success: true,
        subscriptionChangeId: subscriptionChange.id,
      }
    })

    // if the change is inmidiate we trigger the apply change task
    if (whenToApply === "inmidiate") {
      await applySubscriptionChangeTask.triggerAndWait({
        subscriptionChangeId: subscriptionChange.subscriptionChangeId ?? "",
        date,
      })
    }

    return {
      success: true,
    }
  },
})
