import { type Interval, prepareInterval } from "@unprice/tinybird"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import type { Bar } from "@unprice/ui/charts-2"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@unprice/ui/tabs"
import { cn } from "@unprice/ui/utils"
import type { ReactNode } from "react"
import { HydrateClient, trpc } from "~/trpc/server"
import { Filter } from "./filter"

type AnalyticPromiseKey = keyof typeof trpc.analytics

export function AnalyticsCard<T extends string>({
  tabs,
  defaultTab,
  title,
  description,
  className,
  interval,
  promiseKeys,
}: {
  title: string
  className?: string
  description: string
  tabs: {
    id: T
    label: string
    data: Bar<unknown>[]
    limit?: number
    chart: (props: {
      limit?: number
      tab: T
      data: Bar<unknown>[]
    }) => ReactNode
  }[]
  defaultTab: T
  interval: Interval
  promiseKeys: AnalyticPromiseKey[]
}) {
  const { start, end } = prepareInterval(interval)

  // Prefetch data
  promiseKeys.forEach((promiseKey) => {
    void trpc.analytics[promiseKey].prefetch({
      start,
      end,
    })
  })

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab}>
          <div className="flex justify-between">
            <TabsList>
              {tabs.map(({ id, label }) => (
                <TabsTrigger key={id} value={id}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <Filter />
          </div>
          {/* // TODO: add suspense component with prefetch */}

          <HydrateClient>
            {tabs.map(({ id, data, limit, chart }) => (
              <TabsContent key={id} value={id}>
                {chart({ limit, tab: id, data })}
              </TabsContent>
            ))}
          </HydrateClient>
        </Tabs>
      </CardContent>
    </Card>
  )
}
