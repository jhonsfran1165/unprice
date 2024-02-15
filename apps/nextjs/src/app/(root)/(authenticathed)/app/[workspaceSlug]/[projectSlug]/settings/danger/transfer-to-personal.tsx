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
import { useToast } from "@builderai/ui/use-toast"

import { api } from "~/trpc/client"

export function TransferProjectToPersonal() {
  const params = useParams()

  const workspaceSlug = params.workspaceSlug as string
  const projectSlug = params.projectSlug as string

  const toaster = useToast()
  const apiUtils = api.useUtils()
  const router = useRouter()

  const transferProjectToPersonal = api.projects.transferToPersonal.useMutation(
    {
      onSettled: async () => {
        await apiUtils.projects.bySlug.invalidate({ slug: projectSlug })
        router.push(`/${workspaceSlug}/overview`)
      },
      onSuccess: () => {
        toaster.toast({ title: "Project transferred" })
      },
      onError: (err) => {
        if (err instanceof TRPCClientError) {
          toaster.toast({
            title: err.message,
            variant: "destructive",
          })
        } else {
          toaster.toast({
            title: "Project could not be transferred",
            variant: "destructive",
          })
        }
      },
    }
  )

  const title = "Transfer to Personal"
  const description = "Transfer this project to your personal workspace"

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

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!projectSlug) throw new Error("No project Slug provided")

                  transferProjectToPersonal.mutate({
                    slug: projectSlug,
                  })
                }}
              >
                {`I'm sure. Transfer this project`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
