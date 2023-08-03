import { tb } from "@/lib/tinybird"
import {
  ClickHitsSchema,
  eventSchema,
  pageSchema,
} from "@/lib/validations/analytic"

export const publishClickHits = tb.buildIngestEndpoint({
  datasource: "click_hits__v1",
  event: ClickHitsSchema,
})

export const publishPageViews = tb.buildIngestEndpoint({
  datasource: "page_views__v1",
  event: pageSchema,
})

export const publishEvents = tb.buildIngestEndpoint({
  datasource: "events__v1",
  event: eventSchema,
})
