import { OTLPHttpJsonTraceExporter, registerOTel } from "@vercel/otel"

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    registerOTel({
      serviceName: "my-vercel-app",
      instrumentationConfig: {
        fetch: {
          propagateContextUrls: ["*"],
        },
      },
      attributes: {
        "highlight.project_id": "YOUR_PROJECT_ID",
        "highlight.source": "backend",
      },
      traceExporter: new OTLPHttpJsonTraceExporter({
        headers: {
          "x-api-key": "",
        },
        url: "https://otel.baselime.io/v1/traces",
      }),
    })
  }
}
