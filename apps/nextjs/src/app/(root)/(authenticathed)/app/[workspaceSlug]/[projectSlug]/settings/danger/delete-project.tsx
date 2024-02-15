"use client"

import { useParams, useRouter } from "next/navigation"
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
import { useToast } from "@builderai/ui/use-toast"

import { api } from "~/trpc/client"

export function DeleteProject() {
  const params = useParams()
  const apiUtils = api.useUtils()
  const workspaceSlug = params.workspaceSlug as string
  const projectSlug = params.projectSlug as string
  const toaster = useToast()
  const router = useRouter()

  const deleteProject = api.projects.delete.useMutation({
    onSettled: async () => {
      await apiUtils.projects.bySlug.invalidate({ slug: projectSlug })
      router.push(`/${workspaceSlug}/overview`)
    },
    onSuccess: () => {
      toaster.toast({
        title: "Project deleted",
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
          title: "Project could not be deleted",
          variant: "destructive",
        })
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
                  if (!projectSlug) throw new Error("No project Slug provided")

                  deleteProject.mutate({
                    slug: projectSlug,
                  })
                }}
              >
                {`I'm sure. Delete this project`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
