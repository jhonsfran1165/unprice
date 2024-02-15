import { createSelectSchema } from "drizzle-zod"
import type { z } from "zod"

import { schema } from "@builderai/db"

export const userSelectBase = createSelectSchema(schema.users)

export type User = z.infer<typeof userSelectBase>
