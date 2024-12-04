import { z } from "zod"

// TODO: use searchParamsSchema instead
export const searchDataParamsSchema = z.object({
  fromDate: z.coerce.number().optional(),
  toDate: z.coerce.number().optional(),
})

export const searchParamsSchemaDataTable = z.object({
  page: z.coerce.number().default(0),
  page_size: z.coerce.number().positive().default(10),
  search: z.string().nullable(),
  from: z.coerce.number().nullable(),
  to: z.coerce.number().nullable(),
})

export type SearchParamsDataTable = z.infer<typeof searchParamsSchemaDataTable>
