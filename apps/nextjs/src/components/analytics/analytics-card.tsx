import { type Interval, prepareInterval } from "@unprice/tinybird"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import { LoadingAnimation } from "@unprice/ui/loading-animation"
import { ScrollArea } from "@unprice/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@unprice/ui/tabs"
import { Typography } from "@unprice/ui/typography"
import { cn } from "@unprice/ui/utils"
import { type ReactNode, Suspense } from "react"
import { HydrateClient, trpc } from "~/trpc/server"
import { Filter } from "./filter"

type AnalyticPromiseKey =
  | "getTotalUsagePerFeatureActiveProject"
  | "getAllFeatureVerificationsActiveProject"

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
    description: string
    chart: (props: {
      tab: T
    }) => ReactNode
  }[]
  defaultTab: T
  interval: Interval
  promiseKeys: AnalyticPromiseKey[]
}) {
  const { start, end } = prepareInterval(interval)

  // Prefetch all key analytics data
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

          <HydrateClient>
            {tabs.map(({ id, chart, description }) => (
              <TabsContent key={id} value={id}>
                <div className="flex flex-col px-1 py-4">
                  <Typography variant="p" affects="removePaddingMargin">
                    {description}
                  </Typography>
                </div>
                <ScrollArea className="h-[400px] p-4">
                  <Suspense
                    fallback={
                      <div className="flex h-[360px] items-center justify-center">
                        <LoadingAnimation className="size-8" />
                      </div>
                    }
                  >
                    <div className="h-max-[360px]">{chart({ tab: id })}</div>
                  </Suspense>
                </ScrollArea>
              </TabsContent>
            ))}
          </HydrateClient>
        </Tabs>
      </CardContent>
    </Card>
  )
}
