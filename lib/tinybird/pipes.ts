import { z } from "zod"

import { tb } from "@/lib/tinybird"

export const getPageHits = tb.buildPipe({
  pipe: "page_hits_test",
  parameters: z.object({}),
  data: z.object({
    date: z.string(),
    session_id: z.string(),
    locale: z.string(),
    country: z.string(),
    referer: z.string(),
    path: z.string(),
    url: z.string(),
    useragent: z.string(),
    device: z.string(),
    browser: z.string(),
  }),
  // opts: {
  //   revalidate: 60, // 60 seconds cache validation
  // },
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
