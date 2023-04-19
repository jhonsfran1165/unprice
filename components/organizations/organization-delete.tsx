"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { mutate } from "swr"

import { fetchAPI } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import LoadingDots from "@/components/shared/loading/loading-dots"

// TODO: move this to a component
export function ConfirmAction({ confirmAction, trigger }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="font-light">
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="button-default">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={confirmAction} className="button-danger">
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// TODO: confirm dialog
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
          className: "button-warning",
        })
        return null
      }

      const org = await fetchAPI({
        url: `/api/org/${orgSlug}`,
        method: "DELETE",
        data: { orgSlug, id },
      })

      if (org) {
        // mutate swr endpoints for org
        mutate(`/api/org`)
        mutate(`/api/org/${orgSlug}`)

        router.push("/")
        router.refresh()
      }
    } catch (error) {
      console.log(error)
    } finally {
      setlLoading(false)
    }
  }

  const trigger = (
    <div className="flex justify-end">
      <Button title="Delete" className="w-28 button-danger">
        {loading ? <LoadingDots color="#808080" /> : "Delete"}
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col space-y-6 px-4 py-5 sm:px-10">
      <h3>Delete Organization</h3>
      <p className="text-sm font-light">
        The project will be permanently deleted, including its deployments and
        domains. This action is irreversible and can not be undone.
      </p>
      <Separator />

      <ConfirmAction confirmAction={deleteOrg} trigger={trigger} />
    </div>
  )
}
