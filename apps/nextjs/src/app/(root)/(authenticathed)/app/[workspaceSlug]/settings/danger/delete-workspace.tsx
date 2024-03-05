"use client"

import { startTransition } from "react"
import { useRouter } from "next/navigation"

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

import { SubmitButton } from "~/components/submit-button"
import { toastAction } from "~/lib/toast"
import { useUser } from "~/lib/use-user"
import { api } from "~/trpc/client"

export function DeleteWorkspace({ workspaceSlug }: { workspaceSlug: string }) {
  const router = useRouter()
  const { user } = useUser()
  const isPersonal = user?.workspaces.find(
    (wk) => wk.slug === workspaceSlug
  )?.isPersonal

  const apiUtils = api.useUtils()

  const title = "Delete"
  const description = "This will delete the workspace and all of its data."

  const deleteWorkspace = api.workspaces.delete.useMutation({
    onSettled: async () => {
      await apiUtils.projects.listByWorkspace.invalidate()
      router.refresh()
    },
    onSuccess: () => {
      toastAction("deleted")
      const nextWorkspace = user?.workspaces.find(
        (wk) => wk.slug !== workspaceSlug
      )

      router.push(`/${nextWorkspace?.slug}/overview`)
    },
  })

  function handleDelete() {
    startTransition(() => {
      deleteWorkspace.mutate({
        slug: workspaceSlug,
      })
    })
  }

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
          <DialogTrigger asChild>
            <Button variant="destructive" disabled={!!isPersonal}>
              {title}
            </Button>
          </DialogTrigger>
          {!!isPersonal && (
            <span className="mr-auto px-2 text-xs text-muted-foreground">
              You can not delete your personal workspace. Contact support if you
              want to delete your account.
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

              <SubmitButton
                component="spinner"
                variant="destructive"
                isDisabled={deleteWorkspace.isPending}
                isSubmitting={deleteWorkspace.isPending}
                label="I'm sure. Delete this workspace"
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete()
                }}
              />
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
