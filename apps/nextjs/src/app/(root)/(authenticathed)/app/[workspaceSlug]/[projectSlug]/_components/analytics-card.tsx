import { Button } from "@builderai/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@builderai/ui/tabs"
import { cn } from "@builderai/ui/utils"
import type { ReactNode } from "react"

export function AnalyticsCard<T extends string>({
  tabs,
  expandLimit,
  hasMore,
  children,
  defaultTab,
  title,
  description,
  className,
}: {
  title: string
  className?: string
  description: string
  tabs: {
    id: T
    label: string
    data: {
      key?: string
      href?: string
      value: number
      name: string
    }[]
  }[]
  expandLimit?: number
  defaultTab: T
  hasMore?: boolean
  children: (props: {
    limit?: number
    tab: T
    data: {
      key?: string
      href?: string
      value: number
      name: string
    }[]
  }) => ReactNode
}) {
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
          {tabs.map(({ id, data }) => (
            <TabsContent key={id} value={id}>
              {children({ limit: expandLimit, tab: id, data })}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      <CardFooter>
        {hasMore && (
          <Button size={"sm"} className="w-44 mx-auto">
            View All
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
