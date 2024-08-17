import { type Database, sql } from "@unprice/db"
import * as schema from "@unprice/db/schema"

export const buildItemsBySubscriptionIdQuery = async ({
  db,
}: {
  db: Database
}) => {
  const items = db.$primary.$with("items").as(
    db
      .select({
        subscriptionId: schema.subscriptionItems.subscriptionId,
        projectId: schema.subscriptionItems.projectId,
        items: sql<
          {
            id: string
            units: number | null
            subscriptionId: string
            featurePlanVersionId: string
            projectId: string
            createdAtM: number
            updatedAtM: number
          }[]
        >`jsonb_agg(
          jsonb_build_object(
            'id', ${schema.subscriptionItems.id},
            'units', ${schema.subscriptionItems.units},
            'subscriptionId', ${schema.subscriptionItems.subscriptionId},
            'featurePlanVersionId', ${schema.subscriptionItems.featurePlanVersionId},
            'projectId', ${schema.subscriptionItems.projectId},
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
      .groupBy(schema.subscriptionItems.subscriptionId, schema.subscriptionItems.projectId)
  )

  return items
}
