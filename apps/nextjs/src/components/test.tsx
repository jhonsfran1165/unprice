import * as React from "react"

import { cn } from "@builderai/ui"

export interface InputWithAddonsProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leading?: React.ReactNode
  trailing?: React.ReactNode
}

const InputWithAddons = React.forwardRef<HTMLInputElement, InputWithAddonsProps>(
  ({ leading, trailing, className, type, ...props }, ref) => {
    return (
      <div className="border-input ring-offset-background focus-within:ring-ring group flex h-9 rounded-md border bg-transparent text-sm focus-within:outline-none focus-within:ring-1 focus-within:ring-offset-1">
        {leading ? (
          <div className="border-input bg-background-bg rounded-e-none rounded-s-md border-r px-3 py-2">
            {leading}
          </div>
        ) : null}
        <input
          type={type}
          className={cn(
            "focus-visible:ring-ring-0 placeholder:text-muted-foreground focus:border-ring flex h-9 w-full rounded-md border-none bg-transparent px-3 py-2 text-sm ring-offset-0 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
        {trailing ? (
          <div className="border-input bg-background-bg rounded-e-md rounded-s-none border-l px-3 py-2">
            {trailing}
          </div>
        ) : null}
      </div>
    )
  }
)
InputWithAddons.displayName = "InputWithAddons"

export { InputWithAddons }
