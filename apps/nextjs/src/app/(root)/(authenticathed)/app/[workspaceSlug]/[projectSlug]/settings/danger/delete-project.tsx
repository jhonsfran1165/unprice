"use client"

import { useRouter } from "next/navigation"
import { TRPCClientError } from "@trpc/client"

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
import { LoadingAnimation } from "@builderai/ui/loading-animation"

import { useToastAction } from "~/lib/use-toast-action"
import { api } from "~/trpc/client"

export function DeleteProject({
  workspaceSlug,
  projectSlug,
}: {
  workspaceSlug: string
  projectSlug: string
}) {
  const apiUtils = api.useUtils()
  const { toast } = useToastAction()
  const router = useRouter()

  const deleteProject = api.projects.delete.useMutation({
    onSettled: async () => {
      await apiUtils.projects.getBySlug.invalidate({ slug: projectSlug })
      router.refresh()
    },
    onSuccess: () => {
      toast("success")
      router.push(`/${workspaceSlug}/overview`)
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        toast("error", err.message)
      } else {
        toast("error")
      }
    },
  })

  const title = "Delete project"
  const description = "This will delete the project and all of its data."

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
            <Button variant="destructive">{title}</Button>
          </DialogTrigger>
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
                className="button-danger"
                variant="destructive"
                onClick={() => {
                  deleteProject.mutate({
                    slug: projectSlug,
                  })
                }}
              >
                {`I'm sure. Delete this project`}

                {deleteProject.isPending && (
                  <LoadingAnimation variant={"destructive"} className="ml-2" />
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
