import { Badge } from "@unprice/ui/badge"
import { Typography } from "@unprice/ui/typography"
import { cn } from "@unprice/ui/utils"
import { CopyButton } from "~/components/copy-button"

export default function HeaderTab({
  title,
  description,
  action,
  className,
  label,
  id,
}: {
  title?: string
  description?: string | null
  action?: React.ReactNode
  className?: string
  label?: string
  id?: string
}) {
  return (
    <div className={cn("flex w-full items-center justify-between px-0", className)}>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Typography variant="h3">{title}</Typography>
          {label && (
            <Badge
              className={cn("ml-2 hidden md:flex", {
                info: label === "active",
                danger: label === "inactive",
              })}
            >
              <span
                className={cn("flex h-2 w-2 rounded-full", {
                  "bg-info-solid": label === "active",
                  "bg-danger-solid": label === "inactive",
                })}
              />
              <span className="ml-1">{label}</span>
            </Badge>
          )}
          {id && <CopyButton value={id} />}
        </div>
        {description && (
          <Typography variant="normal" className="hidden md:flex">
            {description}
          </Typography>
        )}
      </div>
      <div>{action}</div>
    </div>
  )
}
