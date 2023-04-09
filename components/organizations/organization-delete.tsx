"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { mutate } from "swr"

import LoadingDots from "@/components/shared/loading/loading-dots"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function OrganizationDelete({
  orgSlug,
  id,
  isDefault = false,
}: {
  orgSlug: string
  id: number
  isDefault?: boolean
}) {
  const { toast } = useToast()
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
          className:
            "bg-warning-bgActive text-warning-text border-warning-solid",
        })
        return null
      }

      const data = await fetch(`/api/org/${orgSlug}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgSlug, id }),
      })

      const org = await data.json()

      // mutate swr endpoints for org
      mutate(`/api/org`)
      mutate(`/api/org/${orgSlug}`)

      router.push("/")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error deleting org",
        description: error?.message,
        className: "bg-danger-bgActive text-danger-text border-danger-solid",
      })
    } finally {
      setlLoading(false)
    }
  }
  return (
    <div className="flex flex-col space-y-6 px-4 py-5 sm:px-10">
      <h3>Delete Organization</h3>
      <p className="text-sm font-light">
        The project will be permanently deleted, including its deployments and
        domains. This action is irreversible and can not be undone.
      </p>
      <Separator className="bg-background-border" />
      <div className="flex justify-end">
        <Button
          title="Delete"
          onClick={deleteOrg}
          className="w-28 border border-danger-border bg-danger-bg text-danger-text hover:border-danger-borderHover hover:bg-danger-bgHover hover:text-danger-textContrast active:bg-danger-bgActive"
        >
          {loading ? <LoadingDots color="#808080" /> : "Delete"}
        </Button>
      </div>
    </div>
  )
}
