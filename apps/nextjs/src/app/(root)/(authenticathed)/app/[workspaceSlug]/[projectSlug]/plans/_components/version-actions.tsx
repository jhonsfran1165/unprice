"use client"

import { ChevronDown } from "lucide-react"

import type { RouterOutputs } from "@builderai/api"
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
  planVersion,
}: {
  planVersion: RouterOutputs["planVersions"]["getByVersion"]["planVersion"]
}) {
  const updatePlanVersion = api.planVersions.update.useMutation({
    onSuccess: () => {
      toastAction("success", "Version published")
    },
  })

  const syncPlanVersion = api.planVersions.syncWithStripe.useMutation({
    onSuccess: () => {
      toastAction("success", "Version synced")
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
              status: "published",
              currency: planVersion.currency,
              planId: planVersion.planId,
              id: planVersion.id,
              projectId: planVersion.projectId,
              version: planVersion.version,
            })
          }}
          className="text-red-600"
        >
          Publish this version
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            await syncPlanVersion.mutateAsync({
              planId: planVersion.planId,
              planVersionId: planVersion.version,
            })
          }}
        >
          Sync with stripe
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
