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
  console.info(`Generating data for ${customerId} on ${date.toISOString()}`)
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
    // add a random number of seconds to the date to have different timestamps in the same day
    const timestamp = date.getTime() + Math.floor(Math.random() * 1000)

    // ramdom usage between 1 and 100
    const usage = Math.floor(Math.random() * 100) + 1
    // pick a random feature slug
    const featureSlug =
      usageEntitlements[Math.floor(Math.random() * usageEntitlements.length)]?.featureSlug!

    if (featureSlug) {
      const result = await unprice.customers.reportUsage({
        customerId,
        featureSlug,
        usage,
        idempotenceKey: randomUUID(),
        timestamp,
      })

      if (result.result?.success) {
        console.info(`Usage ${usage} reported for ${featureSlug}`)
      } else {
        console.error(`Usage ${usage} reported for ${featureSlug} failed`, result.result?.message)
      }
    }

    // wait 200ms
    await new Promise((resolve) => setTimeout(resolve, 200))

    // pick a random feature slug
    const randomFeatureSlug =
      entitlements[Math.floor(Math.random() * entitlements.length)]?.featureSlug!

    if (randomFeatureSlug) {
      // verify the usage
      const result = await unprice.customers.can({
        customerId,
        featureSlug: randomFeatureSlug,
        timestamp,
      })

      if (result.result?.success) {
        console.info(`Verification ${randomFeatureSlug} verified for ${customerId}`)
      } else {
        console.error(
          `Verification for ${randomFeatureSlug} and ${customerId} cannot be used`,
          result.result?.message
        )
      }
    }
  }

  console.info(`Time taken: ${performance.now() - now}ms`)
}

async function main() {
  const today = new Date()
  // need to create a new date object to avoid change the original date
  const yesterday = new Date(new Date().setDate(today.getDate() - 1))
  const twoDaysAgo = new Date(new Date().setDate(today.getDate() - 2))
  const threeDaysAgo = new Date(new Date().setDate(today.getDate() - 3))
  const fourDaysAgo = new Date(new Date().setDate(today.getDate() - 4))
  const fiveDaysAgo = new Date(new Date().setDate(today.getDate() - 5))
  const customerFree = "cus_1MeUjVxFbv8DP9X7f1UW9"
  const customerPro = "cus_1NEvymKXA6peGHVcCZiHD"
  const customerEnterprise = "cus_1MVdMxZ45uJKDo5z48hYJ"

  // PRO plan
  await generateData(customerPro, today)
  await generateData(customerPro, yesterday)
  await generateData(customerPro, twoDaysAgo)
  await generateData(customerPro, threeDaysAgo)
  await generateData(customerPro, fourDaysAgo)
  await generateData(customerPro, fiveDaysAgo)

  // FREE plan
  await generateData(customerFree, today)
  await generateData(customerFree, yesterday)
  await generateData(customerFree, twoDaysAgo)
  await generateData(customerFree, threeDaysAgo)
  await generateData(customerFree, fourDaysAgo)
  await generateData(customerFree, fiveDaysAgo)

  // ENTERPRISE plan
  await generateData(customerEnterprise, today)
  await generateData(customerEnterprise, yesterday)
  await generateData(customerEnterprise, twoDaysAgo)
  await generateData(customerEnterprise, threeDaysAgo)
  await generateData(customerEnterprise, fourDaysAgo)
  await generateData(customerEnterprise, fiveDaysAgo)
}

main()
