"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { faqSchema } from "@unprice/db/validators"
import type { Page } from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@unprice/ui/form"
import { Input } from "@unprice/ui/input"
import { Separator } from "@unprice/ui/separator"
import { Textarea } from "@unprice/ui/text-area"
import { HelpCircle, Plus, Trash2 } from "lucide-react"
import { type UseFormGetValues, type UseFormSetValue, useForm } from "react-hook-form"
import { FormProvider } from "react-hook-form"
import type { z } from "zod"

interface FAQSectionProps {
  setValue: UseFormSetValue<Page>
  getValues: UseFormGetValues<Page>
}

export function FAQSection({ setValue, getValues }: FAQSectionProps) {
  const faqs = getValues("faqs")

  const faqForm = useForm<z.infer<typeof faqSchema>>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      id: "",
      question: "",
      answer: "",
    },
  })

  const addFaq = (data: z.infer<typeof faqSchema>) => {
    const faq: z.infer<typeof faqSchema> = {
      id: Date.now().toString(),
      question: data.question,
      answer: data.answer,
    }
    setValue("faqs", [...faqs, faq])
    faqForm.reset()
  }

  const removeFaq = (faqId: string) => {
    setValue(
      "faqs",
      faqs.filter((faq) => faq.id !== faqId)
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Frequently Asked Questions
        </CardTitle>
        <CardDescription>Add FAQ items for your page</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new FAQ Form */}
        <FormProvider {...faqForm}>
          <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
            <FormField
              control={faqForm.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the question" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={faqForm.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter the answer" className="min-h-[80px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={faqForm.handleSubmit(addFaq)}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add FAQ
            </Button>
          </div>
        </FormProvider>

        {/* Existing FAQs */}
        {faqs.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <div className="font-medium text-sm">Current FAQs ({faqs.length})</div>
            {faqs.map((faq) => (
              <div key={faq.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-sm">{faq.question}</p>
                    <p className="line-clamp-2 text-muted-foreground text-sm">{faq.answer}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFaq(faq.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
