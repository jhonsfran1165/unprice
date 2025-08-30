import { env } from "../env"
import { Analytics } from "./analytics"

export const analytics = new Analytics({
  emit: env.EMIT_ANALYTICS && env.EMIT_ANALYTICS.toString() === "true",
  tinybirdToken: env.TINYBIRD_TOKEN,
  tinybirdUrl: env.TINYBIRD_URL,
})
