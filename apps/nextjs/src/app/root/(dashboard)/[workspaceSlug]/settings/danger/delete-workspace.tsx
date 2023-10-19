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
import * as Icons from "@builderai/ui/icons"
import { useToast } from "@builderai/ui/use-toast"

import { api } from "~/trpc/client"

export function DeleteWorkspace() {
  const toaster = useToast()
  const router = useRouter()
  const { orgId } = useAuth()

  const title = "Delete workspace"
  const description = "This will delete the workspace and all of its data."

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
              <Icons.Warning className="mr-2 h-6 w-6" />
              <p>This action can not be reverted</p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    await api.organization.deleteOrganization.mutate()
                    toaster.toast({ title: "Workspace deleted" })
                    router.push(`/dashboard`)
                  } catch (err) {
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
                  }
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
