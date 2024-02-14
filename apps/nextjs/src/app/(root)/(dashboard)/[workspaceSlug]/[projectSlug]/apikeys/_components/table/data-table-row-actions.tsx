"use client"

import { startTransition } from "react"
import { useParams, useRouter } from "next/navigation"
import type { Row } from "@tanstack/react-table"
import { TRPCClientError } from "@trpc/client"

import { Button } from "@builderai/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@builderai/ui/dropdown-menu"
import { Ellipsis } from "@builderai/ui/icons"
import { selectApiKeySchema } from "@builderai/validators/apikey"

import { useToastAction } from "~/lib/use-toast-action"
import { api } from "~/trpc/client"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const apikey = selectApiKeySchema.parse(row.original)
  const router = useRouter()
  const projectSlug = useParams().projectSlug as string
  const { toast } = useToastAction()

  const revokeApiKeys = api.apikeys.revokeApiKeys.useMutation({
    onSuccess: () => {
      toast("success")
      router.refresh()
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        toast("error", err.message)
      } else {
        toast("error")
      }
    },
  })

  const rollApiKey = api.apikeys.rollApiKey.useMutation({
    onSuccess: () => {
      toast("success")
      router.refresh()
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        toast("error", err.message)
      } else {
        toast("error")
      }
    },
  })

  function onRevokeKey() {
    startTransition(() => {
      void revokeApiKeys.mutateAsync({
        ids: [apikey.id],
        projectSlug,
      })
    })
  }

  function onRollKey() {
    startTransition(() => {
      void rollApiKey.mutateAsync({
        id: apikey.id,
        projectSlug,
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
