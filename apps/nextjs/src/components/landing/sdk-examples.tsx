"use client"

import { BorderBeam } from "@unprice/ui/border-beam"
import { Button } from "@unprice/ui/button"
import { ScrollArea } from "@unprice/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@unprice/ui/tabs"
import { cn } from "@unprice/ui/utils"
import { useState } from "react"
import { CodeEditor } from "./code-editor"
import CopyToClipboard from "./copy-to-clipboard"

// Sample code examples for different frameworks and methods
const codeExamples = {
  sdk: {
    verifyFeature: `import { Unprice } from "@unprice/api"

const unprice = new Unprice({
  token: process.env.UNPRICE_TOKEN,
  baseUrl: "http://api.unprice.dev",
})

// verify access to a feature
const verifyFeature = await unprice.customers.can({
  customerId: "cus_1GTzSGrapiBW1QwCL3Fcn",
  featureSlug: "feature-1",
})

if (!verifyFeature.result?.access) {
  console.error("Customer does not have access to feature")
}
`,
    reportUsage: `import { Unprice } from "@unprice/api"

const unprice = new Unprice({
  token: process.env.UNPRICE_TOKEN,
  baseUrl: "http://api.unprice.dev",
})

// report usage for a feature
const reportUsage = await unprice.customers.reportUsage({
  customerId: "cus_1GTzSGrapiBW1QwCL3Fcn",
  featureSlug: "feature-1",
  usage: 1,
  idempotenceKey: "123e4567-e89b-12d3-a456-426614174000",
})

if (!reportUsage.result?.success) {
  console.error("Failed to report usage")
}
`,
    signUp: `import { Unprice } from "@unprice/api"

const unprice = new Unprice({
  token: process.env.UNPRICE_TOKEN,
  baseUrl: "http://api.unprice.dev",
})

const signUp = await unprice.customers.signUp({
  name: "John Doe",
  email: "jhonsfran@gmail.com",
  planVersionId: "plan_version_1",
  successUrl: "http://your-app.com/dashboard",
  cancelUrl: "http://your-app.com/failed",
})

const customerId = signUp.result?.customerId

redirect(signUp.result?.url ?? "/")
`,
    getEntitlements: `import { Unprice } from "@unprice/api"

const unprice = new Unprice({
  token: process.env.UNPRICE_TOKEN,
  baseUrl: "http://api.unprice.dev",
})

const entitlements = await unprice.customers.getEntitlements({
  customerId: "cus_1GTzSGrapiBW1QwCL3Fcn",
})
`,
    resetEntitlements: `import { Unprice } from "@unprice/api"

const unprice = new Unprice({
  token: process.env.UNPRICE_TOKEN,
  baseUrl: "http://api.unprice.dev",
})

const reset = await unprice.customers.resetEntitlements({
  customerId: "cus_1GTzSGrapiBW1QwCL3Fcn",
})
`,
    getSubscription: `import { Unprice } from "@unprice/api"

const unprice = new Unprice({
  token: process.env.UNPRICE_TOKEN,
  baseUrl: "http://api.unprice.dev",
})

const subscription = await unprice.customers.getSubscription({
  customerId: "cus_1GTzSGrapiBW1QwCL3Fcn",
})
`,
    getActivePhase: `import { Unprice } from "@unprice/api"

const unprice = new Unprice({
  token: process.env.UNPRICE_TOKEN,
  baseUrl: "http://api.unprice.dev",
})

const activePhase = await unprice.customers.getActivePhase({
  customerId: "cus_1GTzSGrapiBW1QwCL3Fcn",
})
`,
    getUsage: `import { Unprice } from "@unprice/api"

const unprice = new Unprice({
  token: process.env.UNPRICE_TOKEN,
  baseUrl: "http://api.unprice.dev",
})

const usage = await unprice.customers.getUsage({
  customerId: "cus_1GTzSGrapiBW1QwCL3Fcn",
})
`,
    getPaymentMethods: `import { Unprice } from "@unprice/api"

const unprice = new Unprice({
  token: process.env.UNPRICE_TOKEN,
  baseUrl: "http://api.unprice.dev",
})

const paymentMethods = await unprice.customers.getPaymentMethods({
  customerId: "cus_1GTzSGrapiBW1QwCL3Fcn",
  provider: "stripe",
})
`,
    createPaymentMethod: `import { Unprice } from "@unprice/api"

const unprice = new Unprice({
  token: process.env.UNPRICE_TOKEN,
  baseUrl: "http://api.unprice.dev",
})

const createPaymentMethod = await unprice.customers.createPaymentMethod({
  paymentProvider: "stripe",
  customerId: "cus_1GTzSGrapiBW1QwCL3Fcn",
  successUrl: "http://your-app.com/dashboard",
  cancelUrl: "http://your-app.com/failed",
})
`,
  },
  fetch: {
    verifyFeature:
      'const baseUrl = "http://api.unprice.dev"\nconst token = process.env.UNPRICE_TOKEN\n\nawait fetch("' +
      "${baseUrl}/v1/customer/can" +
      '", {\n  method: "POST",\n  headers: {\n    Authorization: "Bearer ${token}",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({\n    customerId: "cus_1GTzSGrapiBW1QwCL3Fcn",\n    featureSlug: "feature-1",\n  }),\n})',
    reportUsage:
      'const baseUrl = "http://api.unprice.dev"\nconst token = process.env.UNPRICE_TOKEN\n\nawait fetch("' +
      "${baseUrl}/v1/customer/reportUsage" +
      '", {\n  method: "POST",\n  headers: {\n    Authorization: "Bearer ${token}",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({\n    customerId: "cus_1GTzSGrapiBW1QwCL3Fcn",\n    featureSlug: "feature-1",\n    usage: 1,\n    idempotenceKey: "123e4567-e89b-12d3-a456-426614174000",\n  }),\n})',
    signUp:
      'const baseUrl = "http://api.unprice.dev"\nconst token = process.env.UNPRICE_TOKEN\n\nawait fetch("' +
      "${baseUrl}/v1/customer/signUp" +
      '", {\n  method: "POST",\n  headers: {\n    Authorization: "Bearer ${token}",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({\n    name: "John Doe",\n    email: "jhonsfran@gmail.com",\n    planVersionId: "plan_version_1",\n    successUrl: "http://your-app.com/dashboard",\n    cancelUrl: "http://your-app.com/failed",\n  }),\n})',
    getEntitlements:
      'const baseUrl = "http://api.unprice.dev"\nconst token = process.env.UNPRICE_TOKEN\n\nawait fetch("' +
      "${baseUrl}/v1/customer/cus_1GTzSGrapiBW1QwCL3Fcn/getEntitlements" +
      '", {\n  method: "GET",\n  headers: {\n    Authorization: "Bearer ${token}",\n    "Content-Type": "application/json",\n  },\n})',
    resetEntitlements:
      'const baseUrl = "http://api.unprice.dev"\nconst token = process.env.UNPRICE_TOKEN\n\nawait fetch("' +
      "${baseUrl}/v1/customer/reset-entitlements" +
      '", {\n  method: "POST",\n  headers: {\n    Authorization: "Bearer ${token}",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({\n    customerId: "cus_1GTzSGrapiBW1QwCL3Fcn",\n  }),\n})',
    getSubscription:
      'const baseUrl = "http://api.unprice.dev"\nconst token = process.env.UNPRICE_TOKEN\n\nawait fetch("' +
      "${baseUrl}/v1/customer/cus_1GTzSGrapiBW1QwCL3Fcn/getSubscription" +
      '", {\n  method: "GET",\n  headers: {\n    Authorization: "Bearer ${token}",\n    "Content-Type": "application/json",\n  },\n})',
    getActivePhase:
      'const baseUrl = "http://api.unprice.dev"\nconst token = process.env.UNPRICE_TOKEN\n\nawait fetch("' +
      "${baseUrl}/v1/customer/cus_1GTzSGrapiBW1QwCL3Fcn/getActivePhase" +
      '", {\n  method: "GET",\n  headers: {\n    Authorization: "Bearer ${token}",\n    "Content-Type": "application/json",\n  },\n})',
    getUsage:
      'const baseUrl = "http://api.unprice.dev"\nconst token = process.env.UNPRICE_TOKEN\n\nawait fetch("' +
      "${baseUrl}/v1/customer/cus_1GTzSGrapiBW1QwCL3Fcn/getUsage" +
      '", {\n  method: "GET",\n  headers: {\n    Authorization: "Bearer ${token}",\n    "Content-Type": "application/json",\n  },\n})',
    getPaymentMethods:
      'const baseUrl = "http://api.unprice.dev"\nconst token = process.env.UNPRICE_TOKEN\n\nawait fetch("' +
      "${baseUrl}/v1/customer/getPaymentMethods" +
      '", {\n  method: "POST",\n  headers: {\n    Authorization: "Bearer ${token}",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({\n    customerId: "cus_1GTzSGrapiBW1QwCL3Fcn",\n    provider: "stripe",\n  }),\n})',
    createPaymentMethod:
      'const baseUrl = "http://api.unprice.dev"\nconst token = process.env.UNPRICE_TOKEN\n\nawait fetch("' +
      "${baseUrl}/v1/customer/createPaymentMethod" +
      '", {\n  method: "POST",\n  headers: {\n    Authorization: "Bearer ${token}",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({\n    paymentProvider: "stripe",\n    customerId: "cus_1GTzSGrapiBW1QwCL3Fcn",\n    successUrl: "http://your-app.com/dashboard",\n    cancelUrl: "http://your-app.com/failed",\n  }),\n})',
  },
}

export function SDKDemo() {
  const [activeFramework, setActiveFramework] = useState("sdk")
  const [activeMethod, setActiveMethod] = useState("verifyFeature")

  // Get the methods for the active framework
  const methods = Object.keys(codeExamples[activeFramework as keyof typeof codeExamples])

  // Get the code for the active framework and method
  const code =
    codeExamples[activeFramework as keyof typeof codeExamples][
      activeMethod as keyof typeof codeExamples.sdk
    ]

  return (
    <div className="relative mx-auto mt-20 flex w-full max-w-6xl flex-col items-center justify-center rounded-2xl bg-background shadow-primary-line shadow-sm ring-1 ring-background-line [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]">
      {/* Framework tabs */}
      <Tabs value={activeFramework} onValueChange={setActiveFramework} className="w-full">
        <div className="border-background-border border-b pt-4">
          <TabsList variant="line">
            <TabsTrigger value="sdk" className="px-5">
              SDK TypeScript
            </TabsTrigger>
            <TabsTrigger value="fetch" className="px-5">
              Fetch API
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value={activeFramework}>
          <div className="flex flex-col md:flex-row">
            {/* Method selection */}
            <div className="w-full border-b md:w-52 md:border-r md:border-b-0">
              <div className="flex flex-row flex-wrap gap-2 px-2 py-4 md:flex-col">
                {methods.map((method) => (
                  <Button
                    key={method}
                    variant="link"
                    onClick={() => setActiveMethod(method)}
                    className={cn(
                      "flex flex-col items-start whitespace-nowrap text-left transition-colors",
                      activeMethod === method
                        ? "text-background-textContrast"
                        : "text-background-text"
                    )}
                  >
                    {/* Format method name for display */}
                    {method.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                  </Button>
                ))}
              </div>
            </div>

            <div className="relative flex h-full w-full overflow-hidden rounded-b-3xl rounded-br-3xl bg-background-base font-mono text-background-text text-sm md:rounded-none md:rounded-br-3xl">
              <div className="absolute top-3 right-3">
                <CopyToClipboard code={code} />
              </div>
              <ScrollArea
                hideScrollBar={true}
                className={cn(
                  "hide-scrollbar w-full",
                  // hack for not having to set height on scroll area
                  "[&>[data-radix-scroll-area-viewport]]:h-full md:[&>[data-radix-scroll-area-viewport]]:h-[30rem]",
                  "[&>[data-radix-scroll-area-viewport]]:w-full"
                )}
              >
                <CodeEditor codeBlock={code} language={"typescript"} />
              </ScrollArea>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <BorderBeam duration={5} size={300} />
    </div>
  )
}
