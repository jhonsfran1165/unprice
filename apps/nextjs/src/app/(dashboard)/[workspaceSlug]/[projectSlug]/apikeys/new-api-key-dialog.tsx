"use client"

import * as React from "react"

import { Button } from "@builderai/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"

import { apiRQ } from "~/trpc/client"
import { CreateApiKeyForm } from "../../_components/create-api-key-form"

export function NewApiKeyDialog(props: { projectSlug: string }) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const apiUtils = apiRQ.useContext()

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="button-primary">Create API Key</Button>
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
            await apiUtils.apikey.listApiKeys.invalidate({
              projectSlug: props.projectSlug,
            })
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
