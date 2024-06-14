import { createInsertSchema, createSelectSchema } from "drizzle-zod"

import * as schema from "../schema"

export const ingestionSelectSchema = createSelectSchema(schema.ingestions)
export const ingestionInsertSchema = createInsertSchema(schema.ingestions)
