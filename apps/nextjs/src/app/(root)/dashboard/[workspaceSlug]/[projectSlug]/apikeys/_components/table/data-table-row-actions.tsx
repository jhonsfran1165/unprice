"use client"

import type { Row } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { startTransition } from "react"

import { selectApiKeySchema } from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@unprice/ui/dropdown-menu"
import { Ellipsis } from "@unprice/ui/icons"

import { useMutation } from "@tanstack/react-query"
import { toastAction } from "~/lib/toast"
import { useTRPC } from "~/trpc/client"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const apikey = selectApiKeySchema.parse(row.original)
  const router = useRouter()
  const trpc = useTRPC()

  const revokeApiKeys = useMutation(
    trpc.apikeys.revoke.mutationOptions({
      onSuccess: () => {
        toastAction("saved")
        router.refresh()
      },
    })
  )

  const rollApiKey = useMutation(
    trpc.apikeys.roll.mutationOptions({
      onSuccess: () => {
        toastAction("success")
        router.refresh()
      },
    })
  )

  function onRevokeKey() {
    startTransition(() => {
      void revokeApiKeys.mutateAsync({
        ids: [apikey.id],
      })
    })
  }

  function onRollKey() {
    startTransition(() => {
      void rollApiKey.mutateAsync({
        id: apikey.id,
      })
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <Ellipsis className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault()
            onRevokeKey()
          }}
          className="text-destructive"
        >
          Revoke Key
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault()
            onRollKey()
          }}
          className="text-destructive"
        >
          Roll Key
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
