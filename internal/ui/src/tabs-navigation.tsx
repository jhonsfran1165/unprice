// Tremor Raw TabNavigation [v0.0.1]

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

const TabNavigation = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitives.Root>,
  Omit<
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitives.Root>,
    "orientation" | "defaultValue" | "dir"
  >
>(({ className, children, ...props }, forwardedRef) => (
  <NavigationMenuPrimitives.Root ref={forwardedRef} {...props} asChild={false}>
    <NavigationMenuPrimitives.List
      className={cn(
        // base
        "flex w-full items-center justify-start border-b",
        className
      )}
    >
      {children}
    </NavigationMenuPrimitives.List>
  </NavigationMenuPrimitives.Root>
))

TabNavigation.displayName = "TabNavigation"

const TabNavigationLink = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitives.Link>,
  Omit<React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitives.Link>, "onSelect"> & {
    disabled?: boolean
  }
>(({ asChild, disabled, className, children, ...props }, forwardedRef) => (
  <NavigationMenuPrimitives.Item className="flex" aria-disabled={disabled}>
    <NavigationMenuPrimitives.Link
      aria-disabled={disabled}
      className={cn(
        "group relative flex shrink-0 select-none items-center justify-center",
        disabled ? "pointer-events-none" : ""
      )}
      ref={forwardedRef}
      asChild={asChild}
      {...props}
    >
      {getSubtree({ asChild, children }, (children) => (
        <span
          className={cn(
            // base
            "-mb-px items-center justify-center whitespace-nowrap border-transparent border-b-2 px-3 pb-3 font-medium text-sm transition-all",
            // text color
            "text-background-text",
            // hover
            "group-hover:text-background-textContrast",
            // border hover
            "group-hover:border-background-borderHover",
            // selected
            "group-data-[active]:border-primary group-data-[active]:text-background-textContrast", // disabled
            disabled ? "pointer-events-none text-muted opacity-50" : "",
            focusRing,
            className
          )}
        >
          {children}
        </span>
      ))}
    </NavigationMenuPrimitives.Link>
  </NavigationMenuPrimitives.Item>
))

TabNavigationLink.displayName = "TabNavigationLink"

export { TabNavigation, TabNavigationLink }
