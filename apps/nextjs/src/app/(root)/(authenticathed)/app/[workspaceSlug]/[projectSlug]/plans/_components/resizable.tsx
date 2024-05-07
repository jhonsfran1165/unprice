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
}

export function ResizablePanelConfig({
  defaultLayout = [30, 70],
  featureList,
  planFeatureList,
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
        minSize={30}
        maxSize={50}
      >
        {featureList}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={50} maxSize={80}>
        {planFeatureList}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
