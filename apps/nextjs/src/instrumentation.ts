import { OTLPHttpJsonTraceExporter, registerOTel } from "@vercel/otel"
import { env } from "./env.mjs"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { BaselimeSDK, VercelPlugin, BetterHttpInstrumentation, StripePlugin } = await import(
      "@baselime/node-opentelemetry"
    )

    const sdk = new BaselimeSDK({
      baselimeKey: env.BASELIME_APIKEY,
      serverless: true,
      resourceAttributes: {
        dataset: "unprice-nextjs",
        service: "unprice-nextjs",
        namespace: "nodejs",
      },
      instrumentations: [
        new BetterHttpInstrumentation({
          plugins: [new VercelPlugin(), new StripePlugin()],
        }),
      ],
    })

    sdk.start()
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    registerOTel({
      serviceName: "unprice-nextjs",
      instrumentationConfig: {
        fetch: {
          propagateContextUrls: ["*"],
        },
      },
      attributes: {
        namespace: "edge",
        service: "unprice-nextjs",
        dataset: "unprice-nextjs",
      },
      traceExporter: new OTLPHttpJsonTraceExporter({
        headers: {
          "x-api-key": env.BASELIME_APIKEY,
          "Content-Type": "application/json",
        },
        url: "https://otel.baselime.io/v1/traces",
      }),
    })
  }
}
