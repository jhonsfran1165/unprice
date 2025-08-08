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

async function generateData(customerId: string, date: Date) {
  const now = performance.now()

  const { result: data } = await unprice.customers.getEntitlements(customerId)

  const entitlements = data?.entitlements

  if (!entitlements) {
    console.error("No entitlements found")
    return
  }

  const usageEntitlements = entitlements.filter(
    (entitlement) => entitlement.featureType === "usage"
  )!

  for (let i = 0; i < 100; i++) {
    // set the date for the timestamp at a random hour + minute + second
    const timestamp = new Date(
      date.setHours(
        Math.floor(Math.random() * 24),
        Math.floor(Math.random() * 60),
        Math.floor(Math.random() * 60)
      )
    ).getTime()

    // ramdom usage between 1 and 100
    const usage = Math.floor(Math.random() * 100) + 1
    // pick a random feature slug
    const featureSlug =
      usageEntitlements[Math.floor(Math.random() * usageEntitlements.length)]?.featureSlug!

    if (featureSlug) {
      await unprice.customers.reportUsage({
        customerId,
        featureSlug,
        usage,
        idempotenceKey: randomUUID(),
        timestamp,
      })

      console.info(`Usage ${usage} reported for ${featureSlug}`)
    }

    // wait 200ms
    await new Promise((resolve) => setTimeout(resolve, 200))

    // pick a random feature slug
    const randomFeatureSlug =
      entitlements[Math.floor(Math.random() * entitlements.length)]?.featureSlug!

    if (randomFeatureSlug) {
      // verify the usage
      await unprice.customers.can({
        customerId,
        featureSlug: randomFeatureSlug,
        timestamp,
      })

      console.info(`Usage ${usage} verified for ${randomFeatureSlug}`)
    }
  }

  console.info(`Time taken: ${performance.now() - now}ms`)
}

async function main() {
  // FREE plan
  await generateData("cus_1MRwznYezUUEvhTidD9L5", new Date("2025-08-01"))
  await generateData("cus_1MRwznYezUUEvhTidD9L5", new Date("2025-08-02"))
  await generateData("cus_1MRwznYezUUEvhTidD9L5", new Date("2025-08-03"))
  await generateData("cus_1MRwznYezUUEvhTidD9L5", new Date("2025-08-04"))
  await generateData("cus_1MRwznYezUUEvhTidD9L5", new Date("2025-08-05"))
  await generateData("cus_1MRwznYezUUEvhTidD9L5", new Date())

  // PRO plan
  await generateData("cus_1MJ7etfqD3jbZTmayncaU", new Date("2025-08-01"))
  await generateData("cus_1MJ7etfqD3jbZTmayncaU", new Date("2025-08-02"))
  await generateData("cus_1MJ7etfqD3jbZTmayncaU", new Date("2025-08-03"))
  await generateData("cus_1MJ7etfqD3jbZTmayncaU", new Date("2025-08-04"))
  await generateData("cus_1MJ7etfqD3jbZTmayncaU", new Date("2025-08-05"))
  await generateData("cus_1MJ7etfqD3jbZTmayncaU", new Date())

  // ENTERPRISE plan
  await generateData("cus_1MVdMxZ45uJKDo5z48hYJ", new Date("2025-08-01"))
  await generateData("cus_1MVdMxZ45uJKDo5z48hYJ", new Date("2025-08-02"))
  await generateData("cus_1MVdMxZ45uJKDo5z48hYJ", new Date("2025-08-03"))
  await generateData("cus_1MVdMxZ45uJKDo5z48hYJ", new Date("2025-08-04"))
  await generateData("cus_1MVdMxZ45uJKDo5z48hYJ", new Date("2025-08-05"))
  await generateData("cus_1MVdMxZ45uJKDo5z48hYJ", new Date())
}

main()
