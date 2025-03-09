"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@unprice/ui/tabs"
import { Typography } from "@unprice/ui/typography"
import { Check } from "lucide-react"
import Arrow from "./arrow"

export default function CodeExampleTabs({
  tab1,
  tab2,
}: {
  tab1?: React.ReactNode
  tab2?: React.ReactNode
}) {
  return (
    <Tabs
      defaultValue="tab1"
      className="mt-14 grid grid-cols-12 gap-6"
    >
      <TabsList
        aria-label="Code examples"
        className="col-span-full flex w-full flex-col gap-6 md:order-2 md:col-span-5"
        variant="line"
      >
        <TabsTrigger
          value="tab1"
          className="group relative w-full rounded-lg border border-border bg-background p-6 transition-all hover:border-primary-border hover:shadow-sm data-[state=active]:border-primary-border data-[state=active]:bg-primary-bg/5"
        >
          <div className="-left-[20px] -translate-y-1/2 -rotate-90 absolute top-1/2 hidden transition-transform group-data-[state=active]:flex">
            <Arrow
              width={18}
              height={8}
              className="fill-primary-text transition-colors"
            />
          </div>
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-background-bg p-2 text-background-text ring-1 ring-border transition-all group-data-[state=active]:bg-primary-bg group-data-[state=active]:text-primary-text group-data-[state=active]:ring-primary-border">
              <Check aria-hidden="true" className="size-5" />
            </div>
            <div className="flex flex-col items-start text-left">
              <h3 className="font-semibold text-background-text tracking-tight transition-colors group-data-[state=active]:text-primary-text">
                Verify feature access
              </h3>
              <p className="mt-2 text-background-text/80 text-sm">
                Verify feature access for your customers.
              </p>
            </div>
          </div>
        </TabsTrigger>

        <TabsTrigger
          value="tab2"
          className="group relative w-full rounded-lg border border-border bg-background p-6 shadow-primary-border transition-all hover:border-primary-border hover:shadow-md data-[state=active]:border-primary-border data-[state=active]:bg-primary-bg/5"
        >
          <div className="-left-[20px] -translate-y-1/2 -rotate-90 absolute top-1/2 hidden transition-transform group-data-[state=active]:flex">
            <Arrow
              width={18}
              height={8}
              className="fill-primary-text transition-colors"
            />
          </div>
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-background-bg p-2 text-background-text ring-1 ring-border transition-all group-data-[state=active]:bg-primary-bg group-data-[state=active]:text-primary-text group-data-[state=active]:ring-primary-border">
              <Check aria-hidden="true" className="size-5" />
            </div>
            <div className="flex flex-col items-start text-left">
              <Typography variant="h4" className="text-background-text tracking-tight transition-colors group-data-[state=active]:text-primary-text">
                Report usage
              </Typography>
              <Typography variant="p" affects="removePaddingMargin">
                Report usage for your customers.
              </Typography>
            </div>
          </div>
        </TabsTrigger>
      </TabsList>

      <div className="col-span-full rounded-lg md:col-span-7">
        <TabsContent value="tab1" className="mt-0">
          {tab1}
        </TabsContent>
        <TabsContent value="tab2" className="mt-0">
          {tab2}
        </TabsContent>
      </div>
    </Tabs>
  )
}
