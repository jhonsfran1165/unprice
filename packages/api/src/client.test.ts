import { describe, expect, test } from "vitest"
import { Unprice } from "./client"

describe("client", () => {
  test("fetch can encode the params without throwing", async () => {
    const unprice = new Unprice({ token: "rawr" })
    expect(() => {
      unprice.customers.can({
        customerId: "meow",
        featureSlug: "meow",
        metadata: {
          meow: "meow",
        },
      })
    }).not.toThrow()
  })

  test("errors are correctly passed through to the caller", async () => {
    const unprice = new Unprice({ token: "rawr" })
    const res = await unprice.customers.can({
      customerId: "meow",
      featureSlug: "meow",
      metadata: {
        meow: "meow",
      },
    })

    expect(res.error).toBeDefined()
    expect(res.error!.code).toEqual("UNAUTHORIZED")
    expect(res.error!.docs).toEqual(
      "https://unprice.dev/docs/api-reference/errors/code/UNAUTHORIZED"
    )
    expect(res.error!.message).toEqual("key not found")
    expect(res.error!.requestId).toBeDefined()
  })
})
