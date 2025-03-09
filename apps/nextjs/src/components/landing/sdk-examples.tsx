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
  nextjs: {
    verifyFeature: `import { Unprice } from "@unprice/unprice"

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
    reportUsage: `import { Unprice } from "@unprice/unprice"

const unprice = new Unprice({
  token: process.env.UNPRICE_TOKEN,
  baseUrl: "http://api.unprice.dev",
})

// report usage for a feature
const reportUsage = await unprice.customers.reportUsage({
  customerId: "cus_1GTzSGrapiBW1QwCL3Fcn",
  featureSlug: "feature-1",
  usage: 1,
})

if (!reportUsage.result?.success) {
  console.error("Failed to report usage")
}
`,
    signUp: `import { Unprice } from "@unprice/unprice"

const unprice = new Unprice({
  token: process.env.UNPRICE_TOKEN,
  baseUrl: "http://api.unprice.dev",
})

const signUp = await unprice.customers.signUp({
  email: "jhonsfran@gmail.com",
  planVersionId: "plan_version_1",
  successUrl: "http://your-app.com/dashboard",
  cancelUrl: "http://your-app.com/failed",
})

const customerId = signUp.result?.customerId

redirect(signUp.result?.url ?? "/")
`,
  },
  nodejs: {
    verifyFeature: `import { Unprice } from "@unprice/unprice"

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
    reportUsage: `import { Unprice } from "@unprice/unprice"

const unprice = new Unprice({
  token: process.env.UNPRICE_TOKEN,
  baseUrl: "http://api.unprice.dev",
})

// report usage for a feature
const reportUsage = await unprice.customers.reportUsage({
  customerId: "cus_1GTzSGrapiBW1QwCL3Fcn",
  featureSlug: "feature-1",
  usage: 1,
})

if (!reportUsage.result?.success) {
  console.error("Failed to report usage")
}
`,
    signUp: `import { Unprice } from "@unprice/unprice"

const unprice = new Unprice({
  token: process.env.UNPRICE_TOKEN,
  baseUrl: "http://api.unprice.dev",
})

const signUp = await unprice.customers.signUp({
  email: "jhonsfran@gmail.com",
  planVersionId: "plan_version_1",
  successUrl: "http://your-app.com/dashboard",
  cancelUrl: "http://your-app.com/failed",
})

const customerId = signUp.result?.customerId

redirect(signUp.result?.url ?? "/")
`,
  },
}

export function SDKDemo() {
  const [activeFramework, setActiveFramework] = useState("nextjs")
  const [activeMethod, setActiveMethod] = useState("verifyFeature")

  // Get the methods for the active framework
  const methods = Object.keys(codeExamples[activeFramework as keyof typeof codeExamples])

  // Get the code for the active framework and method
  const code =
    codeExamples[activeFramework as keyof typeof codeExamples][
      activeMethod as keyof typeof codeExamples.nextjs
    ]

  return (
    <div className="relative mx-auto mt-20 flex w-full max-w-6xl flex-col items-center justify-center rounded-2xl bg-background shadow-primary-line shadow-sm ring-1 ring-background-line">
      {/* Framework tabs */}
      <Tabs value={activeFramework} onValueChange={setActiveFramework} className="w-full">
        <div className="border-background-border border-b pt-4">
          <TabsList variant="line">
            <TabsTrigger value="nextjs" className="px-5">
              Next.js
            </TabsTrigger>
            <TabsTrigger value="nodejs" className="px-5">
              Node.js
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value={activeFramework}>
          <div className="flex flex-col md:flex-row">
            {/* Method selection */}
            <div className="w-full border-b md:w-52 md:border-r md:border-b-0">
              <div className="p-2">
                {methods.map((method) => (
                  <Button
                    key={method}
                    variant="link"
                    onClick={() => setActiveMethod(method)}
                    className={cn(
                      "transition-colors",
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

            <div className="relative flex h-full w-full overflow-hidden rounded-b-3xl bg-background-base font-mono text-background-text sm:rounded-none sm:rounded-br-3xl sm:text-sm">
              <div className="absolute top-3 right-3">
                <CopyToClipboard code={code} />
              </div>
              <ScrollArea
                hideScrollBar={true}
                className={cn(
                  "hide-scrollbar",
                  // hack for not having to set height on scroll area
                  "[&>[data-radix-scroll-area-viewport]]:h-[27.5rem]"
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
