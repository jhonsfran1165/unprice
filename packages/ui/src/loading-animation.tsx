import { Loader2 } from "lucide-react"

import { cn } from "./utils"

type Props = React.ComponentProps<"div">

export function LoadingAnimation({ className, ...props }: Props) {
  return (
    <div
      className={cn("m-auto flex justify-center align-middle", className)}
      {...props}
    >
      <Loader2 className="h-4 w-4 animate-spin" />
    </div>
  )
}
