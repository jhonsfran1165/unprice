import { OTLPHttpJsonTraceExporter, registerOTel } from "@vercel/otel"
import { env } from "./env"

export function register() {
  registerOTel({
    serviceName: "unprice-nextjs",
    instrumentationConfig: {
      fetch: {
        propagateContextUrls: ["*"],
      },
    },
    traceExporter: new OTLPHttpJsonTraceExporter({
      headers: {
        Authorization: `Bearer ${env.AXIOM_API_TOKEN}`,
        "X-Axiom-Dataset": `${env.AXIOM_DATASET}`,
      },
      url: "https://api.axiom.co/v1/traces",
    }),
  })
}
