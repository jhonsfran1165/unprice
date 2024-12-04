"use client"
import * as TabsPrimitives from "@radix-ui/react-tabs"
import React from "react"

import { cn, focusRing } from "./utils"

const Tabs = (
  props: Omit<React.ComponentPropsWithoutRef<typeof TabsPrimitives.Root>, "orientation">
) => {
  return <TabsPrimitives.Root {...props} />
}

Tabs.displayName = "Tabs"

type TabsListVariant = "line" | "solid"

const TabsListVariantContext = React.createContext<TabsListVariant>("line")

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitives.List> {
  variant?: TabsListVariant
}

const variantStyles: Record<TabsListVariant, string> = {
  line: cn(
    // base
    "flex w-full items-center justify-start border-b"
    // border color
  ),
  solid: cn(
    // base
    "inline-flex items-center justify-center rounded-md p-1",
    // border color
    // "border-gray-200 dark:border-gray-800",
    // background color
    "bg-muted text-muted-foreground"
  ),
}

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitives.List>, TabsListProps>(
  ({ className, variant = "solid", children, ...props }, forwardedRef) => (
    <TabsPrimitives.List
      ref={forwardedRef}
      className={cn(variantStyles[variant], className)}
      {...props}
    >
      <TabsListVariantContext.Provider value={variant}>{children}</TabsListVariantContext.Provider>
    </TabsPrimitives.List>
  )
)

TabsList.displayName = "TabsList"

function getVariantStyles(tabVariant: TabsListVariant) {
  switch (tabVariant) {
    case "line":
      return cn(
        // base
        "-mb-px items-center justify-center whitespace-nowrap border-b-2 border-transparent px-3 pb-3 text-sm font-medium transition-all",
        // text color
        "text-background-text",
        // hover
        "hover:text-background-textContrast",
        // border hover
        "hover:border-background-borderHover",
        // selected
        "data-[state=active]:border-primary data-[state=active]:text-background-textContrast",
        // disabled
        "disabled:pointer-events-none disabled:text-muted disabled:opacity-50"
      )
    case "solid":
      return cn(
        // base
        "inline-flex items-center justify-center whitespace-nowrap rounded px-3 py-1 transition-all text-sm font-medium",
        // text color
        "text-background-text",
        // hover
        "hover:text-background-textContrast",
        // selected
        "data-[state=active]:bg-background data-[state=active]:text-background-textContrast data-[state=active]:shadow-sm",
        // disabled
        "disabled:pointer-events-none disabled:text-muted disabled:opacity-50"
      )
  }
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitives.Trigger>
>(({ className, children, ...props }, forwardedRef) => {
  const variant = React.useContext(TabsListVariantContext)
  return (
    <TabsPrimitives.Trigger
      ref={forwardedRef}
      className={cn(getVariantStyles(variant), focusRing, className)}
      {...props}
    >
      {children}
    </TabsPrimitives.Trigger>
  )
})

TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitives.Content>
>(({ className, ...props }, forwardedRef) => (
  <TabsPrimitives.Content ref={forwardedRef} className={cn("outline-none", className)} {...props} />
))

TabsContent.displayName = "TabsContent"

export { Tabs, TabsContent, TabsList, TabsTrigger }
