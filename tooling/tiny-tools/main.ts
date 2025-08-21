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
  baseUrl: process.env.UNPRICE_API_URL || "http://localhost:8787",
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
  const today = new Date()

  const yesterday = new Date(today.setDate(today.getDate() - 3))
  const twoDaysAgo = new Date(today.setDate(today.getDate() - 4))
  const threeDaysAgo = new Date(today.setDate(today.getDate() - 5))
  const fourDaysAgo = new Date(today.setDate(today.getDate() - 6))
  const fiveDaysAgo = new Date(today.setDate(today.getDate() - 7))
  const customerFree = "cus_1MeUjVxFbv8DP9X7f1UW9"
  const customerPro = "cus_1MJ7etfqD3jbZTmayncaU"
  const customerEnterprise = "cus_1MVdMxZ45uJKDo5z48hYJ"

  // FREE plan
  await generateData(customerFree, yesterday)
  await generateData(customerFree, twoDaysAgo)
  await generateData(customerFree, threeDaysAgo)
  await generateData(customerFree, fourDaysAgo)
  await generateData(customerFree, fiveDaysAgo)
  await generateData(customerFree, today)

  // PRO plan
  await generateData(customerPro, yesterday)
  await generateData(customerPro, twoDaysAgo)
  await generateData(customerPro, threeDaysAgo)
  await generateData(customerPro, fourDaysAgo)
  await generateData(customerPro, fiveDaysAgo)
  await generateData(customerPro, today)

  // ENTERPRISE plan
  await generateData(customerEnterprise, yesterday)
  await generateData(customerEnterprise, twoDaysAgo)
  await generateData(customerEnterprise, threeDaysAgo)
  await generateData(customerEnterprise, fourDaysAgo)
  await generateData(customerEnterprise, fiveDaysAgo)
  await generateData(customerEnterprise, today)
}

main()
