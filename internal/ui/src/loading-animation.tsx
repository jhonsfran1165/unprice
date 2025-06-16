import { Loader } from "lucide-react"
import type React from "react"
import type { SVGProps } from "react"

import { cn } from "./utils"

type Props = React.ComponentProps<"div"> & {
  variant?: "default" | "dots"
}

export function LoadingAnimation({ className, variant = "default", ...props }: Props) {
  return (
    <div className="m-auto flex justify-center align-middle" {...props}>
      {variant === "default" ? (
        <Loader
          className={cn("size-4 animate-spin", className)}
          style={{ animationDuration: "1s" }}
        />
      ) : (
        <LoadingDots className={cn("size-4", className)} />
      )}
    </div>
  )
}

function LoadingDots({
  width = 24,
  height = 24,
  dur = "0.75s",
}: SVGProps<SVGElement>): JSX.Element {
  return (
    <svg
      className="fill-current"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="4" cy="12" r="3">
        <animate id="a" begin="0;b.end-0.25s" attributeName="r" dur={dur} values="3;.2;3" />
      </circle>
      <circle cx="12" cy="12" r="3">
        <animate begin="a.end-0.6s" attributeName="r" dur={dur} values="3;.2;3" />
      </circle>
      <circle cx="20" cy="12" r="3">
        <animate id="b" begin="a.end-0.45s" attributeName="r" dur={dur} values="3;.2;3" />
      </circle>
    </svg>
  )
}
