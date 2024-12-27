import { tb } from "./client"
import { usageSchema } from "./validators"

export const reportUsage = tb.buildIngestEndpoint({
  datasource: "usage__v1",
  event: usageSchema,
})
