import { Unprice } from "@unprice/unprice"

async function main() {
  const client = new Unprice({
    baseUrl: "http://api.localhost:3000",
    token: "unprice_live_3TysBhiRKPvWgVrg44cyUrYPSsyL",
  })

  // const rest = await client.customers.signUp({
  //   email: "dsdsdsd@test.com",
  //   planVersionId: "pv_3UP2BnRAQh5JUaQPtRHTpLEaC3my",
  //   successUrl: "https://success.com",
  //   cancelUrl: "https://cancel.com",
  // })

  const rest = await client.customers.signUp({
    email: "dsdsdsd@test.com",
    planVersionId: "pv_3UP2BnRAQh5JUaQPtRHTpLEaC3my",
    successUrl: "https://success.com",
    cancelUrl: "https://cancel.com",
  })

  // const rest = await client.customers.entitlements({
  //   customerId: "cus_3UcG1ATVkrbjfuNZpLvo6aLq7F59",
  // })

  console.log(rest.error)

  console.log(rest)
}

main().catch((e) => {
  console.error("Migration failed")
  console.error(e)
  process.exit(1)
})
