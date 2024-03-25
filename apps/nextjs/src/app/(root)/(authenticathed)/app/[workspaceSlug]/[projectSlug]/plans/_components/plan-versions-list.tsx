import Link from "next/link"
import { notFound } from "next/navigation"
import { Check, ChevronDown, GalleryHorizontalEnd } from "lucide-react"

import type { RouterOutputs } from "@builderai/api"
import { cn } from "@builderai/ui"
import { Button } from "@builderai/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@builderai/ui/dropdown-menu"

export const runtime = "edge"

export default function PlanVersionList(props: {
  plan: RouterOutputs["plans"]["getBySlug"]["plan"]
  activePlanVersionId: number
  workspaceSlug: string
  projectSlug: string
}) {
  const { activePlanVersionId, workspaceSlug, projectSlug, plan } = props

  const activeVersion = plan.versions.find(
    (version) => version.version === activePlanVersionId
  )

  if (!activeVersion) {
    notFound()
  }

  return (
    <div className="flex">
      {plan.versions.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-[200px]" variant="ghost">
              <GalleryHorizontalEnd className="mr-2 h-4 w-4" />
              {`Version V${activeVersion.version} ${activeVersion.latest ? "(latest)" : ""}`}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>All versions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {plan.versions.map((version) => {
              return (
                <DropdownMenuItem key={version.id}>
                  <Link
                    prefetch={false}
                    href={`/${workspaceSlug}/${projectSlug}/plans/${plan.slug}/${version.version}`}
                    className="relative line-clamp-1 flex w-full items-center justify-between"
                  >
                    <span className="text-xs">
                      {`${plan.title} - V${version.version}`}
                      {version.latest ? " (latest) " : " "}
                      {version.status}
                    </span>

                    <Check
                      className={cn(
                        "absolute right-0 h-4 w-4",
                        version.version === activeVersion.version
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center font-semibold">No versions yet</div>
      )}
    </div>
  )
}
