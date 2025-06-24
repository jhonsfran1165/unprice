"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { type Page, pageInsertBaseSchema } from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
import { Card, CardContent } from "@unprice/ui/card"
import { Form } from "@unprice/ui/form"
import { toast } from "@unprice/ui/sonner"
import { Save } from "lucide-react"
import { useForm } from "react-hook-form"
import { api } from "~/trpc/client"
import { BasicInformation } from "./basic-information"
import { ColorPalettePicker } from "./color-palette-picker"
import { FAQSection } from "./faq-section"
import { LogoUpload } from "./logo-upload"
import { PlanSelection } from "./plan-selection"

export default function PageBuilderConfig({ page }: { page: Page }) {
  const form = useForm<Page>({
    resolver: zodResolver(pageInsertBaseSchema),
    defaultValues: {
      ...page,
    },
  })

  const { mutateAsync: updatePage, isPending } = api.pages.update.useMutation({
    onSuccess: () => {
      toast.success("Configuration saved successfully!", {
        description: "Your page builder settings have been saved.",
      })
    },
    onError: (error) => {
      toast.error("Failed to save configuration", {
        description: error.message,
      })
    },
  })

  const handleSaveConfig = async (data: Page) => {
    await updatePage({
      ...data,
    })
  }

  return (
    <div className="flex flex-col">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSaveConfig)} className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Configuration Form */}
            <div className="space-y-6">
              <BasicInformation control={form.control} />
              <PlanSelection
                control={form.control}
                setValue={form.setValue}
                getValues={form.getValues}
              />
              <FAQSection setValue={form.setValue} getValues={form.getValues} />
            </div>
            <div className="space-y-6">
              <LogoUpload
                control={form.control}
                setValue={form.setValue}
                getValues={form.getValues}
              />
              <ColorPalettePicker
                control={form.control}
                setValue={form.setValue}
                watch={form.watch}
              />
              <Card>
                <CardContent className="pt-6">
                  <Button
                    onClick={form.handleSubmit(handleSaveConfig)}
                    className="w-full"
                    disabled={isPending}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isPending ? "Saving..." : "Save Configuration"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
