import { PropsWithChildren } from "react"
import { Ghost } from "lucide-react"

import { cn } from "@/lib/utils"

import { Particles } from "./particles"

type Props = {
  title: string
  description?: string
  className?: string
}

export const EmptyState: React.FC<PropsWithChildren<Props>> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative flex h-full flex-1 flex-col items-center gap-4 p-8",
        className
      )}
    >
      <Ghost />
      <h3 className="text-zinc-900 dark:text-zinc-100 mt-2 text-sm font-semibold">
        {title}
      </h3>
      <p className="text-zinc-500 mt-1 text-sm">{description}</p>
      <div className="mt-8">{children}</div>
      <Particles className="absolute inset-0 -z-10 opacity-50" quantity={50} />
    </div>
  )
}
