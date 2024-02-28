import { createSelectSchema } from "drizzle-zod"
import type { z } from "zod"

import * as schema from "../schema"

export const userSelectBase = createSelectSchema(schema.users)

export type User = z.infer<typeof userSelectBase>
