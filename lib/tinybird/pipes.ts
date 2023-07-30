import { Tinybird } from "@chronark/zod-bird"
import { z } from "zod"

const tb = new Tinybird({ token: process.env.TINYBIRD_TOKEN! })

export const getTotalAvgPageDuration = tb.buildPipe({
  pipe: "get_total_average_page_duration__v1",
  parameters: z.object({
    documentId: z.string(),
    since: z.number(),
  }),
  data: z.object({
    pageNumber: z.string(),
    avg_duration: z.number(),
  }),
})

export const getViewPageDuration = tb.buildPipe({
  pipe: "get_page_duration_per_view__v1",
  parameters: z.object({
    documentId: z.string(),
    viewId: z.string(),
    since: z.number(),
  }),
  data: z.object({
    pageNumber: z.string(),
    avg_duration: z.number(),
  }),
})