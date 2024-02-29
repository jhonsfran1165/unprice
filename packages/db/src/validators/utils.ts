import { z } from "zod"

export const searchDataParamsSchema = z.object({
  fromDate: z.coerce.number().optional(),
  toDate: z.coerce.number().optional(),
})
