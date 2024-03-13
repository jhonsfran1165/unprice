"use client"

import { PlusIcon, Search } from "lucide-react"

import type { PlanVersionFeature } from "@builderai/db/validators"
import { cn } from "@builderai/ui"
import { Button } from "@builderai/ui/button"
import { Input } from "@builderai/ui/input"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@builderai/ui/resizable"
import { Separator } from "@builderai/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@builderai/ui/tabs"

import { useActiveFeature, useSelectedFeatures } from "../use-mail"
import { FeatureConfig } from "./feature-config"
import { DomainDialog } from "./feature-dialog"
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
  const [activeFeature] = useActiveFeature()
  const [planFeatures] = useSelectedFeatures()

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
        minSize={10}
        maxSize={20}
      >
        <div className={cn("flex h-[52px] items-center justify-between px-4")}>
          <h1 className="truncate text-xl font-bold">All features</h1>
          <DomainDialog>
            <Button variant="ghost" size="icon">
              <PlusIcon className="h-4 w-4" />
            </Button>
          </DomainDialog>
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
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={25}>
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
            <PlanFeatureList features={[]} id={"plan-addons"} />
          </TabsContent>
        </Tabs>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[2]} minSize={25}>
        <FeatureConfig feature={activeFeature ?? null} />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
