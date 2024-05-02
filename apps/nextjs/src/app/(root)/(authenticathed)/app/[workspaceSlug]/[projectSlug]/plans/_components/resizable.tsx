"use client"

import React from "react"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@builderai/ui/resizable"

interface ResizablePanelConfigProps {
  defaultLayout: number[] | undefined
  featureList: React.ReactNode
  planFeatureList: React.ReactNode
  featureConfig: React.ReactNode
}

export function ResizablePanelConfig({
  defaultLayout = [20, 30, 50],
  featureList,
  planFeatureList,
  featureConfig,
}: ResizablePanelConfigProps) {
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
        {featureList}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={10} maxSize={30}>
        {planFeatureList}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[2]} maxSize={70}>
        {featureConfig}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
