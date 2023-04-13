import useOrganizationExist from "@/hooks/use-organization-exist"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { orgSlug } from "@/lib/validations/org"

// -------------------------------------------------------------
export const orgPostSchema = z.object({ orgSlug })

export type orgPostType = z.infer<typeof orgPostSchema>
