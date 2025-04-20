import { describe, expect, it } from "vitest"

// dummy test for now
describe("dummy test", () => {
  it("should pass", () => {
    expect(true).toBe(true)
  })
})

// describe("client", () => {
//   test("errors are correctly passed through to the caller", async () => {
//     const unprice = new Unprice({ token: "rawr", baseUrl: "http://localhost:8787" })
//     const res = await unprice.customers.can({
//       customerId: "meow",
//       featureSlug: "meow",
//       metadata: {
//         meow: "meow",
//       },
//     })

//     expect(res.error).toBeDefined()
//     expect(res.error!.code).toEqual("UNAUTHORIZED")
//     expect(res.error!.docs).toEqual(
//       "https://unprice.dev/docs/api-reference/errors/code/UNAUTHORIZED"
//     )
//     expect(res.error!.message).toEqual("key not found")
//     expect(res.error!.requestId).toBeDefined()
//   })
// })
