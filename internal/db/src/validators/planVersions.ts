import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"
import { extendZodWithOpenApi } from "zod-openapi"
import { versions } from "../schema/planVersions"
import { featureSelectBaseSchema } from "./features"
import { planVersionFeatureSelectBaseSchema } from "./planVersionFeatures"
import { planSelectBaseSchema } from "./plans"
import {
  billingAnchorSchema,
  billingIntervalCountSchema,
  billingIntervalSchema,
  currencySchema,
  planTypeSchema,
} from "./shared"

extendZodWithOpenApi(z)

export const planVersionMetadataSchema = z.object({
  externalId: z.string().optional(),
})

export const billingConfigSchema = z.object({
  name: z.string().min(1),
  billingInterval: billingIntervalSchema,
  billingIntervalCount: billingIntervalCountSchema,
  billingAnchor: billingAnchorSchema.default("dayOfCreation"),
  planType: planTypeSchema,
})

export const insertBillingConfigSchema = billingConfigSchema
  .partial()
  .required({
    name: true,
    billingInterval: true,
    billingIntervalCount: true,
    planType: true,
  })
  .superRefine((data, ctx) => {
    // config is required for recurring plans
    if (data.planType === "recurring" && !data.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Billing interval is required for recurring plans",
        path: ["name"],
        fatal: true,
      })

      return false
    }

    // billing anchor required for recurring plans
    if (data.planType === "recurring" && !data.billingAnchor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Billing anchor is required",
        path: ["billingAnchor"],
        fatal: true,
      })

      return false
    }

    // onetime plans default to day of creation
    if (data.planType === "onetime") {
      data.billingAnchor = 0
    }

    return true
  })
  .openapi({
    description: "The billing configuration for the plan version",
  })

export const planVersionSelectBaseSchema = createSelectSchema(versions, {
  tags: z.array(z.string()),
  metadata: planVersionMetadataSchema,
  currency: currencySchema,
  billingConfig: billingConfigSchema.openapi({
    description: "The billing configuration for the plan version",
  }),
})

export const versionInsertBaseSchema = createInsertSchema(versions, {
  tags: z.array(z.string()),
  metadata: planVersionMetadataSchema,
  currency: currencySchema,
  billingConfig: insertBillingConfigSchema,
})
  .required({
    planId: true,
    currency: true,
    paymentProvider: true,
    paymentMethodRequired: true,
    whenToBill: true,
    billingConfig: true,
    autoRenew: true,
  })
  .partial({
    projectId: true,
    id: true,
  })
  .omit({
    createdAtM: true,
    updatedAtM: true,
  })

export const planVersionExtendedSchema = planVersionSelectBaseSchema.extend({
  planFeatures: z.array(
    planVersionFeatureSelectBaseSchema.extend({
      feature: featureSelectBaseSchema,
    })
  ),
})

export const getPlanVersionListSchema = z.object({
  onlyPublished: z.boolean().optional().openapi({
    description: "Whether to include published plan versions",
    example: true,
  }),
  onlyEnterprisePlan: z.boolean().optional().openapi({
    description: "Whether to include enterprise plan versions",
    example: false,
  }),
  onlyLatest: z.boolean().optional().openapi({
    description: "Whether to include the latest plan version",
    example: true,
  }),
  billingInterval: billingIntervalSchema.optional().openapi({
    description: "The billing interval to filter the plan versions",
    example: "month",
  }),
  currency: currencySchema.optional().openapi({
    description: "The currency to filter the plan versions",
    example: "USD",
  }),
})

export const getPlanVersionApiResponseSchema = planVersionSelectBaseSchema.extend({
  plan: planSelectBaseSchema.openapi({
    description: "The plan information",
  }),
  planFeatures: z.array(
    planVersionFeatureSelectBaseSchema.extend({
      displayFeatureText: z.string().openapi({
        description: "The text you can use to show the clients",
      }),
      feature: featureSelectBaseSchema.openapi({
        description: "The feature information",
      }),
    })
  ),
  flatPrice: z.string().openapi({
    description: "Flat price of the plan",
  }),
})

export type InsertPlanVersion = z.infer<typeof versionInsertBaseSchema>
export type PlanVersionMetadata = z.infer<typeof planVersionMetadataSchema>
export type PlanVersion = z.infer<typeof planVersionSelectBaseSchema>
export type BillingConfig = z.infer<typeof billingConfigSchema>
export type InsertBillingConfig = z.infer<typeof insertBillingConfigSchema>
export type PlanVersionApi = z.infer<typeof getPlanVersionApiResponseSchema>
export type PlanVersionExtended = z.infer<typeof planVersionExtendedSchema>
