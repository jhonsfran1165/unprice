import * as React from "react"

import { cn } from "@builderai/ui"

export interface InputWithAddonsProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leading?: React.ReactNode
  trailing?: React.ReactNode
}

const InputWithAddons = React.forwardRef<
  HTMLInputElement,
  InputWithAddonsProps
>(({ leading, trailing, className, type, ...props }, ref) => {
  return (
    <div className="group flex h-9 w-full rounded-md border border-input bg-transparent text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {leading ? (
        <div className="border-r border-input bg-muted px-3 py-2">
          {leading}
        </div>
      ) : null}
      <input
        type={type}
        className={cn(
          "focus-visible:ring-ring-0 flex h-9 w-full rounded-md bg-transparent px-3 py-2 text-sm ring-offset-0 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
      {trailing ? (
        <div className="border-l border-input bg-muted px-3 py-2">
          {trailing}
        </div>
      ) : null}
    </div>
  )
})
InputWithAddons.displayName = "InputWithAddons"

export { InputWithAddons }
