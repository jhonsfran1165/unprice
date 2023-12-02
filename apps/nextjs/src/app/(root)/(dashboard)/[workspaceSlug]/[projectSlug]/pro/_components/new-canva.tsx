"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { TRPCClientError } from "@trpc/client"

import type { CreateCanva } from "@builderai/db/schema/canva"
import { createCanvaSchema } from "@builderai/db/schema/canva"
import { Button } from "@builderai/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@builderai/ui/form"
import { Input } from "@builderai/ui/input"
import { useToast } from "@builderai/ui/use-toast"

import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export function NewCanvaDialog() {
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()

  const projectSlug = params.projectSlug as string
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useZodForm({
    schema: createCanvaSchema,
    defaultValues: {
      content: {},
      slug: "",
      projectSlug,
    },
  })

  const createCanva = api.canva.create.useMutation({
    onSettled: (data) => {
      // if (data?.id) window.location.href = `/canva/${data.id}`
      router.refresh()
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        toast({
          title: err.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "There was an error the canva. Please try again.",
          variant: "destructive",
        })
      }
    },
  })

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="button-primary">Create canva</Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data: CreateCanva) => {
              createCanva.mutate(data)
            })}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>Create Canva</DialogTitle>
              <DialogDescription>Add a new canva</DialogDescription>
            </DialogHeader>

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Canva Slug</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Acme Inc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Continue</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
