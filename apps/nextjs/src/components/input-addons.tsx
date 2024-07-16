import * as React from "react"

import { cn } from "@builderai/ui/utils"

export interface InputWithAddonsProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leading?: React.ReactNode
  trailing?: React.ReactNode
}

const InputWithAddons = React.forwardRef<HTMLInputElement, InputWithAddonsProps>(
  ({ leading, trailing, className, type, ...props }, ref) => {
    return (
      <div className="group flex h-9 w-full rounded-md border border-input bg-transparent text-sm ring-offset-background focus-within:outline-none focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-1">
        {leading ? (
          <div className="rounded-s-md rounded-e-none border-input border-r bg-background-bg px-3 py-2">
            {leading}
          </div>
        ) : null}
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border-none bg-transparent px-3 py-2 text-sm ring-offset-0 disabled:cursor-not-allowed file:border-0 focus:border-ring file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring-0 focus-visible:ring-offset-0",
            className
          )}
          ref={ref}
          {...props}
        />
        {trailing ? (
          <div className="rounded-s-none rounded-e-md border-input border-l bg-background-bg px-3 py-2">
            {trailing}
          </div>
        ) : null}
      </div>
    )
  }
)
InputWithAddons.displayName = "InputWithAddons"

export { InputWithAddons }
