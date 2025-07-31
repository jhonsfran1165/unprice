"use client"

import * as NavigationMenuPrimitives from "@radix-ui/react-navigation-menu"
import React from "react"

import { cn, focusRing } from "./utils"

function getSubtree(
  options: { asChild: boolean | undefined; children: React.ReactNode },
  content: React.ReactNode | ((children: React.ReactNode) => React.ReactNode)
) {
  const { asChild, children } = options
  if (!asChild) return typeof content === "function" ? content(children) : content

  const firstChild = React.Children.only(children) as React.ReactElement
  return React.cloneElement(firstChild, {
    children: typeof content === "function" ? content(firstChild.props.children) : content,
  })
}

type TabNavigationVariant = "line" | "solid"

const TabNavigationVariantContext = React.createContext<TabNavigationVariant>("line")

interface TabNavigationProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitives.Root>,
    "orientation" | "defaultValue" | "dir"
  > {
  variant?: TabNavigationVariant
}

const variantStyles: Record<TabNavigationVariant, string> = {
  line: cn(
    // base
    "flex w-full items-center justify-start border-b"
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

function getVariantStyles(tabVariant: TabNavigationVariant) {
  switch (tabVariant) {
    case "line":
      return cn(
        // base
        "-mb-px items-center justify-center whitespace-nowrap border-transparent border-b-2 px-3 pb-3 font-medium text-sm transition-all",
        // text color
        "text-background-text",
        // hover
        "group-hover:text-background-textContrast",
        // border hover
        "group-hover:border-background-borderHover",
        // selected
        "group-data-[active]:border-primary group-data-[active]:text-background-textContrast",
        // disabled
        "group-data-[disabled]:pointer-events-none group-data-[disabled]:text-muted group-data-[disabled]:opacity-50"
      )
    case "solid":
      return cn(
        // base
        "inline-flex items-center justify-center whitespace-nowrap rounded px-3 py-1 transition-all text-sm font-medium",
        // text color
        "text-background-text",
        // hover
        "group-hover:text-background-textContrast",
        // selected
        "group-data-[active]:bg-background group-data-[active]:text-background-textContrast data-[state=active]:shadow-sm",
        // disabled
        "group-data-[disabled]:pointer-events-none group-data-[disabled]:text-muted group-data-[disabled]:opacity-50"
      )
  }
}

const TabNavigation = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitives.Root>,
  TabNavigationProps
>(({ className, children, variant = "line", ...props }, forwardedRef) => (
  <NavigationMenuPrimitives.Root ref={forwardedRef} {...props} asChild={false}>
    <NavigationMenuPrimitives.List className={cn(variantStyles[variant], className)}>
      <TabNavigationVariantContext.Provider value={variant}>
        {children}
      </TabNavigationVariantContext.Provider>
    </NavigationMenuPrimitives.List>
  </NavigationMenuPrimitives.Root>
))

TabNavigation.displayName = "TabNavigation"

const TabNavigationLink = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitives.Link>,
  Omit<React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitives.Link>, "onSelect"> & {
    disabled?: boolean
  }
>(({ asChild, disabled, className, children, ...props }, forwardedRef) => {
  const variant = React.useContext(TabNavigationVariantContext)
  return (
    <NavigationMenuPrimitives.Item className="flex" aria-disabled={disabled}>
      <NavigationMenuPrimitives.Link
        aria-disabled={disabled}
        className={cn(
          "group relative flex shrink-0 select-none items-center justify-center",
          focusRing,
          disabled ? "pointer-events-none opacity-50" : ""
        )}
        ref={forwardedRef}
        asChild={asChild}
        {...props}
      >
        {getSubtree({ asChild, children }, (children) => (
          <span className={cn(getVariantStyles(variant), focusRing, className)}>{children}</span>
        ))}
      </NavigationMenuPrimitives.Link>
    </NavigationMenuPrimitives.Item>
  )
})

TabNavigationLink.displayName = "TabNavigationLink"

export { TabNavigation, TabNavigationLink }
