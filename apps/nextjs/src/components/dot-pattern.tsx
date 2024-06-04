import { useId } from "react"

import { cn } from "@builderai/ui"

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
    <div className="fixed left-0 top-0 -z-50">
      <div className="sticky left-0 top-0 h-screen w-screen overflow-hidden">
        <svg
          aria-hidden="true"
          className={cn(
            "fill-background-line pointer-events-none absolute inset-0 h-full w-screen",
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
