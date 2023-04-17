import useOrganizationExist from "@/hooks/use-organization-exist"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { orgSlug } from "@/lib/validations/org"

// -------------------------------------------------------------

export const stripePriceId = z.string().min(1, {
  message:
    "invalid stripePriceId for the subscription, it has to be at least 3 characters",
})

// TODO: add trialDays, metadata
export const stripePostSchema = z.object({ orgSlug, stripePriceId })
export const stripePortalPostSchema = z.object({ orgSlug })

export type stripePostType = z.infer<typeof stripePostSchema>
