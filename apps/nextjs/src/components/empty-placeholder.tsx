import type * as React from "react"

import { cn } from "@unprice/ui/utils"

export function EmptyPlaceholder({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative flex h-full min-h-[500px] w-full items-center justify-center rounded-md border border-dashed",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  )
}

EmptyPlaceholder.Icon = function EmptyPlaceHolderIcon({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="flex items-center justify-center rounded-full">{children}</div>
}

type EmptyPlaceholderTitleProps = React.HTMLAttributes<HTMLHeadingElement>

EmptyPlaceholder.Title = function EmptyPlaceholderTitle({
  className,
  ...props
}: EmptyPlaceholderTitleProps) {
  return <h2 className={cn("mt-4 font-semibold text-lg", className)} {...props} />
}

EmptyPlaceholder.Action = function EmptyPlaceHolderAction({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="flex items-center justify-center rounded-full">{children}</div>
}

type EmptyPlaceholderDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

EmptyPlaceholder.Description = function EmptyPlaceholderDescription({
  className,
  ...props
}: EmptyPlaceholderDescriptionProps) {
  return <p className={cn("mt-2 mb-4 text-muted-foreground text-sm", className)} {...props} />
}
