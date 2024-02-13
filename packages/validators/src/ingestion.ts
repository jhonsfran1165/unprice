import { createInsertSchema, createSelectSchema } from "drizzle-zod"

import { schema } from "@builderai/db"

export const ingestionSelectSchema = createSelectSchema(schema.ingestions)
export const ingestionInsertSchema = createInsertSchema(schema.ingestions)
