import { Loader } from "lucide-react"

import { cn } from "./utils"

type Props = React.ComponentProps<"div">

export function LoadingAnimation({ className, ...props }: Props) {
  return (
    <div className={cn("m-auto flex justify-center align-middle", className)} {...props}>
      <Loader
        className="h-4 w-4 animate-spin"
        // 1s feels a bit fast
        style={{ animationDuration: "2s" }} />
    </div>
  )
}
