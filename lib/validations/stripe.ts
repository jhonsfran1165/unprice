import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { orgSlug } from "@/lib/validations/org"
import useOrganizationExist from "@/hooks/use-organization-exist"

// -------------------------------------------------------------

export const stripePriceId = z.string().min(1, {
  message:
    "invalid stripePriceId for the subscription, it has to be at least 3 characters",
})

export const organizationTiersSchema = z.union([
  z.literal("FREE"),
  z.literal("PRO"),
  z.literal("CUSTOM"),
])

const trialDays = z.number().default(0)
const metadata = z.object({ tier: organizationTiersSchema }).nullable()
const currency = z.union([z.literal("USD"), z.literal("COP"), z.literal("EU")])

export const stripePostSchema = z.object({
  orgSlug,
  stripePriceId,
  trialDays,
  metadata,
  currency,
})

export const stripePortalPostSchema = z.object({ orgSlug })
export type stripePostType = z.infer<typeof stripePostSchema>
