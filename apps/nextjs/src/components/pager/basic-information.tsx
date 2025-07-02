"use client"

import type { Page } from "@unprice/db/validators"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@unprice/ui/form"
import { Input } from "@unprice/ui/input"
import { Textarea } from "@unprice/ui/text-area"
import { Sticker } from "lucide-react"
import type { Control } from "react-hook-form"

interface BasicInformationProps {
  control: Control<Page>
}

export function BasicInformation({ control }: BasicInformationProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sticker className="h-5 w-5" />
          <CardTitle>Basic Information</CardTitle>
        </div>
        <CardDescription>Set up the main details for your page</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Page Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter your page title" {...field} />
              </FormControl>
              <FormDescription>This will be the main heading of your page</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="copy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Page Copy</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your page copy"
                  className="min-h-[100px]"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                A brief copy that will appear below your title. This is a good place to add a call
                to action.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
