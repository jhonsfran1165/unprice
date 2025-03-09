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
import { Unprice } from "@unprice/unprice"

const unprice = new Unprice({
  token: process.env.UNPRICE_TOKEN || "",
  baseUrl: "http://api.localhost:3000",
})

async function main() {
  const customerId = "cus_1GTzSGrapiBW1QwCL3Fcn"

  // get the usage
  const entitlements = await unprice.customers.entitlements({
    customerId,
  })

  for (const entitlement of entitlements.result?.entitlements ?? []) {
    // report random usage between 0 and 100
    const usage = Math.floor(Math.random() * 100)

    // before reporting usage lets verify the feature
    const verifyFeature = await unprice.customers.can({
      customerId,
      featureSlug: entitlement.featureSlug,
    })

    console.info("Verify feature", entitlement.featureSlug)

    if (!verifyFeature.result?.access) {
      console.info(
        `Feature ${entitlement.featureSlug} don't have access, ${verifyFeature.result?.deniedReason}`
      )
      continue
    }

    if (
      entitlement.featureType === "usage" ||
      entitlement.featureType === "tier" ||
      entitlement.featureType === "package"
    ) {
      console.info(`Reporting usage for entitlement ${entitlement.featureSlug}: ${usage}`)

      await unprice.customers.reportUsage({
        customerId,
        featureSlug: entitlement.featureSlug,
        usage,
        idempotenceKey: randomUUID(),
      })
    }
  }
}

main()
