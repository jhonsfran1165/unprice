import { cn } from "@builderai/ui/utils"

export default function HeaderTab({
  title,
  description,
  action,
  className,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex w-full items-center justify-between px-0 md:px-2", className)}>
      <div className="space-y-2">
        <h1 className="text-lg font-semibold leading-none tracking-tight">{title}</h1>
        <h4 className="text-muted-foreground text-sm">{description}</h4>
      </div>
      <div>{action}</div>
    </div>
  )
}
