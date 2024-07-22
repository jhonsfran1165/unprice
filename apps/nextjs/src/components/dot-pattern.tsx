import { useId } from "react"

import { cn } from "@unprice/ui/utils"

interface DotPatternProps {
  width?: number | string | undefined
  height?: number | string | undefined
  x?: number | string | undefined
  y?: number | string | undefined
  cx?: number | string | undefined
  cy?: number | string | undefined
  cr?: number | string | undefined
  className?: string
  [key: string]: number | string | undefined
}
export function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  // cx = 1,
  cy = 1,
  cr = 1,
  className,
  ...props
}: DotPatternProps) {
  const id = useId()

  return (
    <div className="-z-50 fixed top-0 left-0">
      <div className="sticky top-0 left-0 h-screen w-screen overflow-hidden">
        <svg
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 h-full w-screen fill-background-line",
            className
          )}
          {...props}
        >
          <defs>
            <pattern
              id={id}
              width={width}
              height={height}
              patternUnits="userSpaceOnUse"
              patternContentUnits="userSpaceOnUse"
              x={x}
              y={y}
            >
              <circle id="pattern-circle" cx={cy} cy={cy} r={cr} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
        </svg>
      </div>
    </div>
  )
}

export default DotPattern
