import { Badge } from "@builderai/ui/badge"
import { cn } from "@builderai/ui/utils"

export default function HeaderTab({
  title,
  description,
  action,
  className,
  label,
}: {
  title?: string
  description?: string | null
  action?: React.ReactNode
  className?: string
  label?: string
}) {
  return (
    <div className={cn("flex w-full items-center justify-between px-0", className)}>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <h1 className="font-semibold text-xl leading-none tracking-tight">{title}</h1>
          {label && (
            <Badge className={"info ml-2"}>
              <span className="flex h-2 w-2 rounded-full bg-info-solid" />
              <span className="ml-1">{label}</span>
            </Badge>
          )}
        </div>
        {description && <h4 className="text-muted-foreground text-sm">{description}</h4>}
      </div>
      <div>{action}</div>
    </div>
  )
}
