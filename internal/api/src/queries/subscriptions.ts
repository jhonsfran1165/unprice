import { type Database, sql } from "@unprice/db"
import * as schema from "@unprice/db/schema"

// TODO: delete this
export const buildItemsBySubscriptionIdQuery = async ({
  db,
}: {
  db: Database
}) => {
  const items = db.$primary.$with("items").as(
    db
      .select({
        subscriptionPhaseId: schema.subscriptionPhases.id,
        projectId: schema.subscriptionPhases.projectId,
        items: sql<
          {
            id: string
            units: number | null
            featurePlanVersionId: string
            projectId: string
            subscriptionPhaseId: string
            isUsage: boolean
            createdAtM: number
            updatedAtM: number
          }[]
        >`jsonb_agg(
          jsonb_build_object(
            'id', ${schema.subscriptionItems.id},
            'units', ${schema.subscriptionItems.units},
            'subscriptionPhaseId', ${schema.subscriptionPhases.id},
            'featurePlanVersionId', ${schema.subscriptionItems.featurePlanVersionId},
            'projectId', ${schema.subscriptionItems.projectId},
            'isUsage', ${schema.subscriptionItems.units} > 0,
            'createdAtM', ${schema.subscriptionItems.createdAtM},
            'updatedAtM', ${schema.subscriptionItems.updatedAtM}
          )
        )`
          .mapWith({
            mapFromDriverValue: (
              value: {
                id: string
                units: number | null
                subscriptionId: string
                featurePlanVersionId: string
                projectId: string
                subscriptionPhaseId: string
                isUsage: boolean
                createdAtM: number
                updatedAtM: number
              }[]
            ) => {
              return value
            },
          })
          .as("items"),
      })
      .from(schema.subscriptionItems)
      .groupBy(schema.subscriptionPhases.id, schema.subscriptionPhases.projectId)
  )

  return items
}
