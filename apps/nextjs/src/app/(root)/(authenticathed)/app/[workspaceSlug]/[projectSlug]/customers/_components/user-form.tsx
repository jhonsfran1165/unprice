"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"

import type { CreateCustomer, Customer } from "@builderai/db/validators"
import {
  customerInsertSchema,
  updateCustomerSchema,
} from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@builderai/ui/form"
import { Pencil, Plus } from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"
import { Separator } from "@builderai/ui/separator"

import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

type UserFormProps =
  | {
      projectSlug: string
      mode: "create"
      user?: Customer
    }
  | {
      projectSlug: string
      mode: "edit"
      user: Customer
    }

export function UserForm({ projectSlug, user, mode }: UserFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const defaultValues =
    mode === "edit"
      ? user
      : {
          projectSlug: projectSlug,
          name: "",
          email: "",
        }

  // async validation only when creating a new feature
  const forSchema =
    mode === "edit"
      ? updateCustomerSchema
      : customerInsertSchema.extend({
          email: z
            .string()
            .email()
            .min(3)
            .refine((_slug) => {
              // const data = await featureExist.mutateAsync({
              //   projectSlug: projectSlug,
              //   slug: slug,
              // })

              // if (data.feature?.id) {
              //   return false
              // }

              // TODO: implement emailExist

              return true
            }, "Email already exists."),
        })

  const form = useZodForm({
    schema: forSchema,
    defaultValues,
  })

  const createUser = api.subscriptions.createCustomer.useMutation({
    onSettled: () => {
      router.refresh()
    },
    onSuccess: () => {
      toastAction("success")
      form.reset()
      setIsOpen(false)
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size={"icon"} className="h-8 w-8">
          {mode === "edit" && <Pencil className="h-4 w-4" />}
          {mode === "create" && <Plus className="h-4 w-4" />}
          <span className="sr-only">configure</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[700px]">
        <DialogHeader>
          <DialogTitle>Edit/Create User</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you are done.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="add-user"
            onSubmit={form.handleSubmit(async (data: CreateCustomer) => {
              if (mode === "edit") {
                // await updateFeature.mutateAsync({
                //   ...(data as UpdateUserSubscription),
                //   id: user.id,
                // })
                return
              } else if (mode === "create") {
                await createUser.mutateAsync(data)
                return
              }
            })}
            className="space-y-6"
          >
            <div className="flex justify-between gap-2">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>email</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            form="add-user"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <div className="mr-2" role="status">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-r-transparent" />
              </div>
            )}
            {mode === "edit" && "Save"}
            {mode === "create" && "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
