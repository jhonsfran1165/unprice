"use client"
import { useRouter } from "next/navigation"

import { Button } from "@unprice/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@unprice/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@unprice/ui/dialog"
import { LoadingAnimation } from "@unprice/ui/loading-animation"

import { toastAction } from "~/lib/toast"
import { api } from "~/trpc/client"

// TODO: could use server actions
export function TransferProjectToPersonal({
  projectSlug,
}: {
  projectSlug: string
}) {
  const apiUtils = api.useUtils()
  const router = useRouter()

  const transferProjectToPersonal = api.projects.transferToPersonal.useMutation({
    onSettled: async () => {
      await apiUtils.projects.getBySlug.invalidate({ slug: projectSlug })
      router.refresh()
    },
    onSuccess: (data) => {
      toastAction("success")
      router.push(`/${data?.workspaceSlug}`)
    },
  })

  const title = "Transfer to Personal"
  const description = "Transfer this project to your personal workspace"

  return (
    <Card className="border-danger">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="flex items-center">{description}</CardDescription>
      </CardHeader>

      <CardFooter className="border-t px-6 py-4">
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
                disabled={transferProjectToPersonal.isPending}
                onClick={() => {
                  transferProjectToPersonal.mutate({
                    slug: projectSlug,
                  })
                }}
              >
                {`I'm sure. Transfer this project`}
                {transferProjectToPersonal.isPending && <LoadingAnimation className="ml-2" />}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
