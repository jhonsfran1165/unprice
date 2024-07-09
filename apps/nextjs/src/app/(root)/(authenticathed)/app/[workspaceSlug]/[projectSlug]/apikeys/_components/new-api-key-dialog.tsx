"use client"
import { useState } from "react"

import { Button } from "@builderai/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"
import { Add } from "@builderai/ui/icons"
import CreateApiKeyForm from "./create-api-key-form"

export default function NewApiKeyDialog() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Add className="mr-2 h-4 w-4" /> Create API Key
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>Fill out the form to create an API key.</DialogDescription>
        </DialogHeader>
        <CreateApiKeyForm
          setDialogOpen={setDialogOpen}
          defaultValues={{
            name: "",
            expiresAt: null,
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
