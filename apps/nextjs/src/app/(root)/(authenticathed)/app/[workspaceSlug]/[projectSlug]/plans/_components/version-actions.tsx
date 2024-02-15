"use client"

import { TRPCClientError } from "@trpc/client"

import { Button } from "@builderai/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@builderai/ui/dropdown-menu"
import { MoreHorizontal } from "@builderai/ui/icons"
import { useToast } from "@builderai/ui/use-toast"

import { api } from "~/trpc/client"

export function VersionActions({
  planId,
  versionId,
  projectSlug,
}: {
  planId: string
  versionId: number
  projectSlug: string
}) {
  const toaster = useToast()

  const updatePlanVersion = api.plans.updateVersion.useMutation({
    onSuccess: () => {
      toaster.toast({
        title: "Version published",
        description: `Version published successfully.`,
      })
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        toaster.toast({
          title: err.message,
          variant: "destructive",
        })
      } else {
        toaster.toast({
          title: "Error updating plan",
          variant: "destructive",
          description:
            "An issue occurred while updating the plan. Please try again.",
        })
      }
    },
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <span className="sr-only">Actions</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => {
            console.log("clicked")
          }}
        >
          Content filter preferences
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await updatePlanVersion.mutateAsync({
              planId,
              versionId,
              projectSlug,
              status: "published",
            })
          }}
          className="text-red-600"
        >
          Publish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
