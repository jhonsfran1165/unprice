// import { featureUsageSchema } from "./utils"
// TODO: use this to get the token
// cat .tinyb | jq .token
// TODO: use for now https://mockingbird.tinybird.co

// console.info(JSON.stringify(featureUsageSchema, null, 2))

// const tbGenerator = new TinybirdGenerator({
//   schema: featureUsageSchema,
//   eps: 100, // events per second
//   limit: 1000, // limit of events to generate
//   endpoint: "https://api.tinybird.co", // endpoint to use
//   logs: true,
//   datasource: "feature_usage_v1", // datasource to use
//   token: process.env.TINYBIRD_TOKEN || "" // token to use
// })

// async function main() {

//   console.info("Generating data...")

//   await tbGenerator.generate()

//   console.info("Data generated successfully")
// }

// main()

import { randomUUID } from "node:crypto"
import { Unprice } from "@unprice/api"

const unprice = new Unprice({
  token: process.env.UNPRICE_TOKEN || "",
  baseUrl: "http://localhost:8787",
})

async function main() {
  const now = performance.now()
  const customerId = "cus_1H7KQFLr7RepUyQBKdnvY"

  // get the usage
  const entitlements = await unprice.customers.reportUsage(customerId, {
    featureSlug: "tokens",
    usage: 100,
    idempotenceKey: randomUUID(),
  })

  console.info(entitlements)
  console.info(`Time taken: ${performance.now() - now}ms`)
}

main()
