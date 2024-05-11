import Link from "next/link"
import { Box, Combine, Target } from "lucide-react"

import { Separator } from "@builderai/ui/separator"

export default function Stepper({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex flex-col px-2 py-2 sm:px-4">
        <div className="space-y-4">
          <Link
            href={"#"}
            className="flex flex-row items-center gap-2 text-xs text-primary-text"
          >
            <Combine className="h-5 w-5 text-primary-text" />
            <span className="hidden sm:inline">Features</span>
          </Link>
          <Separator className="mx-2 h-6" orientation="vertical" />
          <Link
            href={"#"}
            className="flex flex-row items-center gap-2 text-xs hover:text-background-textContrast"
          >
            <Box className="h-5 w-5" />
            <span className="hidden sm:inline">Addons</span>
          </Link>
          <Separator className="mx-2 h-6" orientation="vertical" />
          <Link
            href={"#"}
            className="flex flex-row items-center gap-2 text-xs hover:text-background-textContrast"
          >
            <Target className="h-5 w-5" />
            <span className="hidden sm:inline">Review</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
