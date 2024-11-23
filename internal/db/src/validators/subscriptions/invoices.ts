import { createSelectSchema } from "drizzle-zod"
import { invoices } from "../../schema"

export const subscriptionInvoiceSelectSchema = createSelectSchema(invoices)

export type SubscriptionInvoice = typeof invoices.$inferSelect
