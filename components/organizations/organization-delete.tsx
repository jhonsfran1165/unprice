"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { mutate } from "swr"

import { fetchAPI } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { ConfirmAction } from "@/components/shared/confirm-action"
import { Icons } from "@/components/shared/icons"

export function OrganizationDelete({
  orgSlug,
  id,
  isDefault = false,
}: {
  orgSlug: string
  id: string
  isDefault?: boolean
}) {
  const router = useRouter()
  const [loading, setlLoading] = useState(false)

  const deleteOrg = async () => {
    try {
      setlLoading(true)

      if (isDefault) {
        toast({
          title: "Error deleting org",
          description:
            "This organization is the default one. Please check another organization as default before perform this action.",
          className: "button-warning",
        })
        return null
      }

      const org = await fetchAPI({
        url: `/api/org/${orgSlug}`,
        method: "DELETE",
        data: { orgSlug, id },
      })

      if (org.slug) {
        // mutate swr endpoints for org
        mutate(`/api/org`)
        mutate(`/api/org/${orgSlug}`)

        router.push("/")
        router.refresh()
      }
    } catch (e) {
      const { error } = JSON.parse(e?.message ?? e)

      toast({
        title: `Error ${error?.code || ""}`,
        description: error?.message || "",
        className: "danger",
      })
    } finally {
      setlLoading(false)
    }
  }

  const trigger = (
    <div className="flex justify-end">
      <Button disabled={loading} title="Delete" className="button-danger w-28">
        {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
        Delete
      </Button>
    </div>
  )

  return (
    <Card className="mb-10 border-danger-solid">
      <CardHeader>
        <CardTitle>Delete Organization</CardTitle>
        <CardDescription>
          The project will be permanently deleted, including its deployments and
          domains. This action is irreversible and can not be undone.
        </CardDescription>
      </CardHeader>
      <div className="flex items-center justify-center px-6 pb-6">
        <Separator />
      </div>
      <CardFooter>
        <ConfirmAction confirmAction={deleteOrg} trigger={trigger} />
      </CardFooter>
    </Card>
  )
}
