"use client"

import { ChevronDown } from "lucide-react"

import { Button } from "@builderai/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@builderai/ui/dropdown-menu"

import { toastAction } from "~/lib/toast"
import { api } from "~/trpc/client"

export function VersionActions({
  planId,
  versionId,
}: {
  planId: string
  versionId: number
}) {
  const updatePlanVersion = api.plans.updateVersion.useMutation({
    onSuccess: () => {
      toastAction("success", "Version published")
    },
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={"custom"}>
          <span className="sr-only">Actions</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => {
            console.log("clicked")
          }}
        >
          Delete this version
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await updatePlanVersion.mutateAsync({
              planId,
              versionId,
              status: "published",
            })
          }}
          className="text-red-600"
        >
          Publish this version
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
