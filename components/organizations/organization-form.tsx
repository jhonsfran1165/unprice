"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { SubmitHandler, useForm } from "react-hook-form"
import { mutate } from "swr"

import { trackEvent } from "@/lib/analytics/track-event"
import { ORGANIZATION_TYPES } from "@/lib/config/layout"
import { Organization } from "@/lib/types/supabase"
import { createSlug, fetchAPI } from "@/lib/utils"
import { orgPostSchema, orgPostType } from "@/lib/validations/org"
import useOrganizationExist from "@/hooks/use-organization-exist"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/auth/supabase-provider"
import { Icons } from "@/components/shared/icons"

import "./styles.css"

// TODO: clean this up for a better validation of exist account - maybe better use zod
// watch elements to validate and clean errors at the same time
export function OrganizationForm({ org }: { org?: Organization | null }) {
  const router = useRouter()
  const { supabase } = useSupabase()

  const action = org ? "edit" : "new"

  const [data, _] = useState<orgPostType>({
    id: org?.id || null,
    name: org?.name || "",
    slug: org?.slug || "",
    description: org?.description || "",
    image: org?.image || "",
    type: org?.type || "PERSONAL",
  })

  const [loading, setLoading] = useState(false)

  const form = useForm<orgPostType>({
    resolver: zodResolver(orgPostSchema),
    defaultValues: {
      ...data,
    },
  })

  const {
    watch,
    handleSubmit,
    clearErrors,
    setError,
    setValue,
    getValues,
    reset,
  } = form

  // watch important fields
  const watchSlug = watch("slug")
  const OrgExist = useOrganizationExist({ orgSlug: watchSlug })
  const exist = action === "new" ? OrgExist : false
  const watchImage = watch("image")

  useEffect(() => {
    if (exist) {
      setError("slug", {
        type: "custom",
        message: "this organization exists",
      })
    } else {
      clearErrors("slug")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exist])

  const onSubmit: SubmitHandler<orgPostType> = async (dataForm) => {
    try {
      setLoading(true)
      const method = action === "new" ? "POST" : "PUT"

      // We use next js api endpoint here instead of supabase client directly because we use supabaseAdmin
      // keys in order to be able to bypass the RLS for creating new organizations.
      // When creating new organizations, a users has to be authenticated and create orgs, profiles and other things
      // for that we created a postgres function so it can be an atomic transaction in case of failure
      const org = await fetchAPI({
        url: "/api/org",
        method,
        data: {
          ...data,
          ...dataForm,
        },
      })

      if (org.slug) {
        toast({
          title: "Organization saved",
          description: `Organization ${org.slug} saved successfully`,
          className: "info",
        })

        if (action === "new") {
          // refreshing supabase JWT after creating a new organization
          // we handle authorization to other orgs with the JWT payload
          const { error } = await supabase.auth.refreshSession()
          // if refresh token is expired or something else then logout
          if (error) await supabase.auth.signOut()

          // Refresh the current route and fetch new data from the server without
          // losing client-side browser or React state.
          router.refresh()
          // redirect to the new created org
          router.push(`/org/${org.slug}`)
        } else {
          // if update we only mutate swr endpoints for the update org so we fetch those changes
          mutate(`/api/org`)
          mutate(`/api/org/${org.slug}`)
        }
        await trackEvent("initGuidedSelling", { pageUrl: "" })
      } else {
        throw org
      }
    } catch (e) {
      const { error } = JSON.parse(e?.message ?? e)
      toast({
        title: `Error ${error?.code || ""}`,
        description: error?.message || "",
        className: "danger",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-center p-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src={watchImage || ""} alt={"org photo cover"} />
        </Avatar>
        <CardHeader className="w-full">
          <CardTitle className="flex">Organization</CardTitle>
          <CardDescription>
            Use organization for bundle users a projects together, be aware that
            every organization is totally separated from the others.
          </CardDescription>
        </CardHeader>
      </div>
      <div className="flex items-center justify-center px-6 pb-6">
        <Separator />
      </div>
      <CardContent>
        <Form {...form}>
          <form
            id="add-org-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col space-y-6"
          >
            <div className="flex flex-col space-y-6 md:flex-row md:space-x-4 md:space-y-0">
              {/* name field */}
              <div className="w-full space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NAME</FormLabel>

                      <FormControl>
                        <Input
                          placeholder="organization name"
                          {...field}
                          onChange={(e) => {
                            setValue("name", e.target.value)
                            if (action === "new") {
                              const slug = createSlug(e.target.value)
                              setValue("slug", slug)
                              if (
                                getValues("image")?.startsWith(
                                  "https://avatar.vercel.sh"
                                ) ||
                                getValues("image") === ""
                              ) {
                                setValue(
                                  "image",
                                  `https://avatar.vercel.sh/${slug}.png`
                                )
                              }
                            }
                          }}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* slug field */}
              <div className="w-full space-y-3">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SLUG</FormLabel>

                      <FormControl>
                        <Input placeholder="slug name" {...field} readOnly />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {/* org type field */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TYPE OF ORGANIZATION</FormLabel>

                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a verified email to display" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.keys(ORGANIZATION_TYPES).map((key, index) => {
                          return (
                            <SelectItem key={key + index} value={key}>
                              {key}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* TODO: add img loader - deleted for now */}

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DESCRIPTION</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add some details about this organization"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <div className="flex justify-end space-x-2">
          {action === "new" && (
            <Button
              onClick={() => reset({ ...data })}
              title="Clear"
              className="button-default w-28"
            >
              {"Clear"}
            </Button>
          )}
          <Button
            disabled={loading || exist}
            form="add-org-form"
            title="Submit"
            type="submit"
            className="button-primary w-28"
          >
            {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
