import Link from "next/link"
import { Box, Combine, Target } from "lucide-react"

import { Separator } from "@builderai/ui/separator"

export default function Stepper({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex flex-col px-4 py-2">
        <div className="space-y-4">
          <Link
            href={"#"}
            className="flex flex-row items-center gap-2 text-xs text-primary"
          >
            <Combine className="h-5 w-5 text-primary" />
            Features
          </Link>
          <Separator className="mx-2 h-6" orientation="vertical" />
          <Link href={"#"} className="flex flex-row items-center gap-2 text-xs">
            <Box className="h-5 w-5" />
            Addons
          </Link>
          <Separator className="mx-2 h-6" orientation="vertical" />
          <Link href={"#"} className="flex flex-row items-center gap-2 text-xs">
            <Target className="h-5 w-5" />
            Review
          </Link>
        </div>
      </div>
    </div>
  )
}
