"use client"

import { useState } from "react"
import dynamic from "next/dynamic"

import { Button } from "@builderai/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"
import { Spinner } from "@builderai/ui/icons"

import { api } from "~/trpc/client"

const CreateApiKeyForm = dynamic(() => import("./create-api-key-form"), {
  ssr: false,
  loading: () => (
    <div className="m-auto flex justify-center align-middle">
      <Spinner className="m-6 h-16 w-16 animate-spin" />
    </div>
  ),
})

export default function NewApiKeyDialog(props: { projectSlug: string }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const apiUtils = api.useUtils()

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size={"sm"}>Create API Key</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Fill out the form to create an API key.
          </DialogDescription>
        </DialogHeader>
        <CreateApiKeyForm
          projectSlug={props.projectSlug}
          onSuccess={async () => {
            setDialogOpen(false)
            await apiUtils.apikeys.listApiKeys.invalidate({
              projectSlug: props.projectSlug,
            })
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
