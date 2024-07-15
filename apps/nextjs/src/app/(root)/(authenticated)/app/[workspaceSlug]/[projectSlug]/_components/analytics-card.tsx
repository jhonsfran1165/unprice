import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@builderai/ui/card"
import type { Bar } from "@builderai/ui/charts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@builderai/ui/tabs"
import { cn } from "@builderai/ui/utils"
import type { ReactNode } from "react"
// import { HydrateClient, trpc } from "~/trpc/server"

export function AnalyticsCard<T extends string>({
  tabs,
  defaultTab,
  title,
  description,
  className,
  children,
}: {
  title: string
  className?: string
  description: string
  tabs: {
    id: T
    label: string
    data: Bar<unknown>[]
    limit?: number
  }[]
  defaultTab: T
  children: (props: {
    limit?: number
    tab: T
    data: Bar<unknown>[]
  }) => ReactNode
}) {
  // TODO: prefetch data when trpc update is released
  // https://github.com/trpc/trpc/pull/5828
  // void trpc.analytics.getAllFeatureVerificationsActiveProject.prefetch({
  //   year: 2024,
  //   month: 7,
  // });

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            {tabs.map(({ id, label }) => (
              <TabsTrigger key={id} value={id}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* <HydrateClient> */}
          {tabs.map(({ id, data, limit }) => (
            <TabsContent key={id} value={id}>
              {children({ limit, tab: id, data })}
            </TabsContent>
          ))}
          {/* </HydrateClient> */}
        </Tabs>
      </CardContent>
    </Card>
  )
}
