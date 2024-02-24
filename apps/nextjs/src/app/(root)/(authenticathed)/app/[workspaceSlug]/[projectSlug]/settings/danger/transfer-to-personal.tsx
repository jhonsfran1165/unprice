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
import { LoadingAnimation } from "@builderai/ui/loading-animation"

import { useToastAction } from "~/lib/use-toast-action"
import { api } from "~/trpc/client"

// TODO: could use server actions
export function TransferProjectToPersonal({
  projectSlug,
}: {
  projectSlug: string
}) {
  const { toast } = useToastAction()
  const apiUtils = api.useUtils()
  const router = useRouter()

  const transferProjectToPersonal = api.projects.transferToPersonal.useMutation(
    {
      onSettled: async () => {
        await apiUtils.projects.getBySlug.invalidate({ slug: projectSlug })
        router.refresh()
      },
      onSuccess: (data) => {
        toast("success")
        router.push(`/${data?.workspaceSlug}/overview`)
      },
      onError: (err) => {
        if (err instanceof TRPCClientError) {
          toast("error", err.message)
        } else {
          toast("error")
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
                disabled={transferProjectToPersonal.isPending}
                onClick={() => {
                  transferProjectToPersonal.mutate({
                    slug: projectSlug,
                  })
                }}
              >
                {`I'm sure. Transfer this project`}
                {transferProjectToPersonal.isPending && (
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
