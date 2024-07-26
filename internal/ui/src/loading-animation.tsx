import { Loader } from "lucide-react"

import { cn } from "./utils"

type Props = React.ComponentProps<"div">

export function LoadingAnimation({ className, ...props }: Props) {
  return (
    <div className="m-auto flex justify-center align-middle" {...props}>
      <Loader
        className={cn("size-4 animate-spin", className)}
        // 1s feels a bit fast
        style={{ animationDuration: "2s" }}
      />
    </div>
  )
}
