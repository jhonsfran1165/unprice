"use client"

import { Search } from "lucide-react"

import type { PlanVersionFeature } from "@builderai/db/validators"
import { cn } from "@builderai/ui"
import { Input } from "@builderai/ui/input"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@builderai/ui/resizable"
import { Separator } from "@builderai/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@builderai/ui/tabs"

import { FeatureForm } from "../../../_components/feature-form"
import { useActiveFeature, useMail, useSelectedFeatures } from "../use-mail"
import { FeatureConfig } from "./feature-config"
import { FeatureList } from "./feature-list"
import { PlanFeatureList } from "./plan-feature-list"

interface PlanVersionConfiguratorProps {
  defaultLayout: number[] | undefined
  features: PlanVersionFeature[]
}

export function PlanVersionConfigurator({
  defaultLayout = [265, 440, 655],
  features,
}: PlanVersionConfiguratorProps) {
  const [mail] = useMail()
  const [activeFeature] = useActiveFeature()
  const [planFeatures] = useSelectedFeatures()

  console.log("activeFeature", activeFeature)

  return (
    <ResizablePanelGroup
      direction="horizontal"
      onLayout={(sizes: number[]) => {
        document.cookie = `react-resizable-panels:layout=${JSON.stringify(
          sizes
        )}`
      }}
      className="h-full max-h-[900px] items-stretch"
    >
      <ResizablePanel
        defaultSize={defaultLayout[0]}
        collapsible={false}
        minSize={15}
        maxSize={20}
        // onCollapse={(collapsed) => {
        //   setIsCollapsed(collapsed)
        //   document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
        //     collapsed
        //   )}`
        // }}
      >
        <div className={cn("flex h-[52px] items-center justify-between px-4")}>
          <h1 className="truncate text-xl font-bold">All features</h1>
          <FeatureForm projectSlug={"projectSlug"} mode="create" />
        </div>

        <Separator />
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 p-4 backdrop-blur">
          <form>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search feature" className="pl-8" />
            </div>
          </form>
        </div>
        <FeatureList features={features} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
        <Tabs defaultValue="all">
          <div className="flex items-center px-4 py-2">
            <h1 className="truncate text-xl font-bold">
              Features on this plan
            </h1>
            <TabsList className="ml-auto">
              <TabsTrigger
                value="all"
                className="text-zinc-600 dark:text-zinc-200 "
              >
                features
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="text-zinc-600 dark:text-zinc-200"
              >
                addons
              </TabsTrigger>
            </TabsList>
          </div>
          <Separator />
          <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 p-4 backdrop-blur">
            <form>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search feature" className="pl-8" />
              </div>
            </form>
          </div>
          <TabsContent value="all" className="m-0">
            <PlanFeatureList features={planFeatures} id={"plan-features"} />
          </TabsContent>
          <TabsContent value="unread" className="m-0">
            <PlanFeatureList
              features={planFeatures.filter((item) => !item.read)}
              id={"plan-addons"}
            />
          </TabsContent>
        </Tabs>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[2]}>
        <FeatureConfig feature={activeFeature ?? null} />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
