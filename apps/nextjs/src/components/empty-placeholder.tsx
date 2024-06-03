import * as React from "react"

import { cn } from "@builderai/ui"

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
  return (
    <div className="flex items-center justify-center rounded-full">
      {children}
    </div>
  )
}

type EmptyPlaceholderTitleProps = React.HTMLAttributes<HTMLHeadingElement>

EmptyPlaceholder.Title = function EmptyPlaceholderTitle({
  className,
  ...props
}: EmptyPlaceholderTitleProps) {
  return (
    // eslint-disable-next-line jsx-a11y/heading-has-content
    <h2 className={cn("mt-4 text-lg font-semibold", className)} {...props} />
  )
}

EmptyPlaceholder.Action = function EmptyPlaceHolderAction({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-center rounded-full">
      {children}
    </div>
  )
}

type EmptyPlaceholderDescriptionProps =
  React.HTMLAttributes<HTMLParagraphElement>

EmptyPlaceholder.Description = function EmptyPlaceholderDescription({
  className,
  ...props
}: EmptyPlaceholderDescriptionProps) {
  return (
    <p
      className={cn("text-muted-foreground mb-4 mt-2 text-sm", className)}
      {...props}
    />
  )
}
