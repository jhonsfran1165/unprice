"use client"

import type React from "react"

import type { Page } from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@unprice/ui/form"
import { toast } from "@unprice/ui/sonner"
import { ImageIcon, Upload, X } from "lucide-react"
import type { Control, UseFormGetValues, UseFormSetValue } from "react-hook-form"
import { api } from "~/trpc/client"

interface LogoUploadProps {
  control: Control<Page>
  setValue: UseFormSetValue<Page>
  getValues: UseFormGetValues<Page>
}

function getLogoSrc(logo: File | string | null): string | undefined {
  if (!logo) return undefined
  if (logo instanceof File) return URL.createObjectURL(logo)
  if (logo.startsWith("http")) return logo // If it's a URL

  return `data:image/webp;base64,${logo}`
}

// TODO: optimize this
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") {
        resolve(result.split(",")[1]!)
      } else {
        reject(new Error("Failed to read file"))
      }
    }
    reader.readAsDataURL(file)
  })
}

export function LogoUpload({ control, setValue, getValues }: LogoUploadProps) {
  const { mutateAsync: uploadLogo } = api.pages.uploadLogo.useMutation({
    onSuccess: (data) => {
      setValue("logo", data.page.logo)
      toast.success("Logo uploaded successfully")
    },
    onError: () => {
      toast.error("Failed to upload logo")
    },
  })

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      toast.error("No file selected")
      return
    }

    // max 1mb
    if (file && file.size > 1024 * 1024) {
      toast.error("Logo must be less than 1MB")
      return
    }

    // only allow png, jpg, svg
    if (file && !file.type.includes("image")) {
      toast.error("Logo must be a PNG, JPG, or SVG")
      return
    }

    const base64 = await fileToBase64(file)

    await uploadLogo({
      name: file.name,
      file: base64,
    }).catch((e) => {
      console.error(e)
      toast.error("Failed to upload logo")
    })
  }

  const removeLogo = () => {
    setValue("logo", null)
    // Reset the file input
    const fileInput = document.getElementById("logo-upload") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo</CardTitle>
        <CardDescription>Upload your page logo</CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={control}
          name="logo"
          render={() => (
            <FormItem>
              <FormLabel>Logo File</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  {/* Logo Preview or Upload Area */}
                  {getValues("logo") ? (
                    <div className="space-y-3">
                      <div className="relative inline-block">
                        <div className="rounded-lg border bg-muted/20 p-4">
                          <img
                            src={getLogoSrc(getValues("logo"))}
                            alt="Logo preview"
                            className="max-h-32 max-w-32 rounded object-contain"
                            onError={() => {
                              console.error("Failed to load image preview")
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeLogo}
                          className="-top-2 -right-2 absolute h-6 w-6 rounded-full p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("logo-upload")?.click()}
                        className="w-full"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Change Logo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center rounded-lg border-2 border-muted-foreground/25 border-dashed bg-muted/10 p-8 transition-colors hover:bg-muted/20">
                        <div className="space-y-2 text-center">
                          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                          <div className="text-muted-foreground text-sm">
                            <p className="font-medium">No logo uploaded</p>
                            <p>Click below to upload an image file</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("logo-upload")?.click()}
                        className="w-full"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Choose Logo
                      </Button>
                    </div>
                  )}

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                </div>
              </FormControl>
              <FormDescription>
                Upload an image file for your page logo (PNG, JPG, SVG)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
