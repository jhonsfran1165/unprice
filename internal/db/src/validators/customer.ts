import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import * as schema from "../schema"
import {
  aggregationMethodSchema,
  currencySchema,
  featureVersionType,
  paymentProviderSchema,
  typeFeatureSchema,
} from "./shared"
import { subscriptionItemsConfigSchema } from "./subscriptions/items"

export const reasonCreditSchema = z.enum([
  "downgrade_in_advance",
  "downgrade_arrear",
  "invoice_total_overdue",
])
export const customerCreditMetadataSchema = z.object({
  reason: reasonCreditSchema.optional().describe("Reason for the invoice credit"),
  note: z.string().optional().describe("Note about the invoice credit"),
})

export const customerMetadataSchema = z.object({
  externalId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  stripeDefaultPaymentMethodId: z.string().optional(),
})

export const customerSelectSchema = createSelectSchema(schema.customers, {
  metadata: customerMetadataSchema,
  timezone: z.string().min(1),
})

export const customerInsertBaseSchema = createInsertSchema(schema.customers, {
  metadata: customerMetadataSchema,
  email: z.string().min(3).email(),
  name: z.string().min(3),
  timezone: z.string().min(1),
})
  .omit({
    createdAtM: true,
    updatedAtM: true,
  })
  .partial({
    id: true,
    projectId: true,
  })

export const customerSignUpSchema = customerInsertBaseSchema
  .partial()
  .required({
    email: true,
  })
  .extend({
    planVersionId: z.string().min(1, "Plan version is required"),
    config: subscriptionItemsConfigSchema.optional(),
    externalId: z.string().optional(),
    successUrl: z.string().url(),
    cancelUrl: z.string().url(),
  })

export const stripeSetupSchema = z.object({
  id: z.string().min(1, "Customer id is required"),
  name: z.string().optional(),
  email: z.string().email(),
  currency: currencySchema,
  timezone: z.string().min(1, "Timezone is required"),
  projectId: z.string().min(1, "Project id is required"),
  externalId: z.string().optional(),
})

export const customerSetUpSchema = z.object({
  id: z.string().min(1, "Customer id is required"),
  projectId: z.string().min(1, "Project id is required"),
  externalId: z.string().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  paymentProvider: paymentProviderSchema,
})

export const stripePlanVersionSchema = z.object({
  id: z.string().min(1, "Plan version id is required"),
  projectId: z.string().min(1, "Project id is required"),
  config: subscriptionItemsConfigSchema.optional(),
  paymentMethodRequired: z.boolean(),
})

export const customerEntitlementMetadataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null()])
)

export const customerEntitlementSchema = createSelectSchema(schema.customerEntitlements, {
  type: featureVersionType,
  metadata: customerEntitlementMetadataSchema,
})

export const customerEntitlementInsertSchema = createInsertSchema(
  schema.customerEntitlements
).partial({
  id: true,
  projectId: true,
})

export const customerEntitlementExtendedSchema = customerEntitlementSchema.extend({
  featureType: typeFeatureSchema,
  aggregationMethod: aggregationMethodSchema,
  featureSlug: z.string(),
})

export const customerEntitlementsSchema = customerEntitlementExtendedSchema.pick({
  featureSlug: true,
  validFrom: true,
  validTo: true,
  featureType: true,
  usage: true,
  limit: true,
  featurePlanVersionId: true,
  aggregationMethod: true,
  units: true,
  id: true,
})

export type StripePlanVersion = z.infer<typeof stripePlanVersionSchema>
export type Customer = z.infer<typeof customerSelectSchema>
export type InsertCustomer = z.infer<typeof customerInsertBaseSchema>
export type StripeSetup = z.infer<typeof stripeSetupSchema>
export type CustomerSignUp = z.infer<typeof customerSignUpSchema>
export type CustomerSetUp = z.infer<typeof customerSetUpSchema>
export type CustomerEntitlement = z.infer<typeof customerEntitlementSchema>
export type InsertCustomerEntitlement = z.infer<typeof customerEntitlementInsertSchema>
export type CustomerEntitlementExtended = z.infer<typeof customerEntitlementExtendedSchema>
export type CustomerEntitlementsExtended = z.infer<typeof customerEntitlementsSchema>
