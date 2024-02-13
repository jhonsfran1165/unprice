"use client"

import { useRouter } from "next/navigation"
import { TRPCClientError } from "@trpc/client"

import { useAuth } from "@builderai/auth"
import { Button } from "@builderai/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"
import { Warning } from "@builderai/ui/icons"
import { useToast } from "@builderai/ui/use-toast"

import { api } from "~/trpc/client"

export function DeleteWorkspace() {
  const toaster = useToast()
  const router = useRouter()
  const { orgId, userId } = useAuth()
  const apiUtils = api.useUtils()

  const title = "Delete workspace"
  const description = "This will delete the workspace and all of its data."

  const deleteOrganization = api.workspace.deleteOrganization.useMutation({
    onSettled: async () => {
      await apiUtils.project.listByActiveWorkspace.invalidate()
      router.refresh()
    },
    onSuccess: async () => {
      toaster.toast({
        title: "Workspace deleted",
      })
      // Push to the user's personal workspace after deleting so clerk can
      // fetch new data
      router.push(`/${userId}/overview`)
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        toaster.toast({
          title: err.message,
          variant: "destructive",
        })
      } else {
        toaster.toast({
          title: "The workspace could not be deleted",
          variant: "destructive",
        })
      }
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="flex items-center">
          {description}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between">
        <Dialog>
          <DialogTrigger asChild disabled={!orgId}>
            <Button variant="destructive">{title}</Button>
          </DialogTrigger>
          {!orgId && (
            <span className="mr-auto px-2 text-sm text-muted-foreground">
              You can not delete your personal workspace
            </span>
          )}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div className="flex items-center font-bold text-destructive">
              <Warning className="mr-2 h-6 w-6" />
              <p>This action can not be reverted</p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteOrganization.mutate()
                }}
              >
                {`I'm sure. Delete this workspace`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
