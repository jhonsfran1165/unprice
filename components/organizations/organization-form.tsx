"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { CldUploadWidget } from "next-cloudinary"
import { SubmitHandler, useForm } from "react-hook-form"
import { mutate } from "swr"

import { OrganizationTypes } from "@/lib/config/layout"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/shared/icons"

import "./styles.css"

// TODO: clean this up for a better validation of exist account - maybe better use zod
// watch elements to validate and clean errors at the same time
export function OrganizationForm({ org }: { org?: Organization | null }) {
  const router = useRouter()

  const action = org ? "edit" : "new"

  const [data, setData] = useState<orgPostType>({
    id: org?.id || null,
    name: org?.name || "",
    slug: org?.slug || "",
    description: org?.description || null,
    image: org?.image || "",
    type: org?.type || "PERSONAL",
  })

  const [loading, setLoading] = useState(false)

  const {
    register,
    watch,
    formState: { errors },
    handleSubmit,
    clearErrors,
    setError,
    setValue,
    getValues,
    reset,
  } = useForm<orgPostType>({
    resolver: zodResolver(orgPostSchema),
    defaultValues: {
      ...data,
    },
  })

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
  }, [exist])

  const onSubmit: SubmitHandler<orgPostType> = async (dataForm) => {
    try {
      setLoading(true)
      const method = action === "new" ? "POST" : "PUT"

      // We use api endpoint instead of supabase directly because we use supabaseAdmin
      // in order to be able to bypass the RLS
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

        // mutate swr endpoints for org
        mutate(`/api/org`)
        mutate(`/api/org/${org.slug}`)

        if (action === "new") {
          router.push(`/org/${org.slug}`)
          // Refresh the current route and fetch new data from the server without
          // losing client-side browser or React state.
          router.refresh()
        }
      } else {
        throw org
      }
    } catch (error) {
      const dataError = JSON.parse(error?.message ?? error).error

      toast({
        title: `Error ${dataError?.code ?? ""} saving org`,
        description: dataError?.message ?? "",
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
        <form
          id="add-org-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col space-y-6"
        >
          <div className="flex flex-col space-y-6 md:flex-row md:space-x-4 md:space-y-0">
            <div className="w-full space-y-3">
              <Label htmlFor="name" className="text-xs">
                NAME
              </Label>
              <Input
                {...register("name")}
                id={"name"}
                aria-invalid={Boolean(errors.name)}
                className="mt-1 w-full"
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
                      setValue("image", `https://avatar.vercel.sh/${slug}.png`)
                    }
                  }
                }}
              />
              {errors.name && (
                <p className="pt-1 text-xs text-error-solid" role="alert">
                  {errors.name?.message}
                </p>
              )}
            </div>

            <div className="w-full space-y-3">
              <Label htmlFor="slug" className="text-xs">
                SLUG
              </Label>
              <Input
                readOnly
                {...register("slug")}
                id={"slug"}
                aria-invalid={Boolean(errors.slug)}
                className="mt-1 w-full"
              />
              {errors.slug && (
                <p className="pt-1 text-xs text-error-solid" role="alert">
                  {errors.slug?.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="type" className="text-xs">
              TYPE OF ORGANIZATION
            </Label>
            <Select
              defaultValue={data?.type || "PERSONAL"}
              aria-invalid={Boolean(errors.type)}
              onValueChange={(value) => {
                const type = OrganizationTypes[value]
                setValue("type", type, { shouldValidate: true })
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Type of the organization" />
              </SelectTrigger>
              <SelectContent
                position={"popper"}
                sideOffset={2}
                className="SelectContent-bgSubtle text-background-text"
              >
                <SelectGroup>
                  {Object.keys(OrganizationTypes).map((key, index) => {
                    return (
                      <SelectItem key={key + index} value={key}>
                        {key}
                      </SelectItem>
                    )
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="pt-1 text-xs text-error-solid" role="alert">
                {errors.type?.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="image" className="text-xs">
              IMAGE (optional)
            </Label>
            <div className="flex h-14 w-full animate-pulse items-center justify-center space-x-2 rounded-md border-2 border-dashed">
              <CldUploadWidget
                signatureEndpoint="/api/cloudinary"
                options={{
                  maxFiles: 1,
                  // TODO: use avatars or something like that
                  folder: "test",
                  multiple: false,
                }}
                onError={(error) => {
                  console.log(error)
                  toast({
                    title: "Error updating image",
                    description: `Something went wrong while updating the image`,
                    className: "danger",
                  })
                }}
                onUpload={(result, widget) => {
                  const {
                    event,
                    info: { secure_url },
                  } = result

                  if (event === "success") {
                    setValue("image", secure_url, { shouldValidate: true })
                  } else {
                    toast({
                      title: "Error updating image",
                      description: `Something went wrong while updating the image`,
                      className: "danger",
                    })
                  }

                  widget.close() // Close widget immediately after successful upload
                }}
              >
                {({ open }) => {
                  function handleOnClick(e) {
                    e.preventDefault()
                    open()
                  }

                  return (
                    <button
                      onClick={handleOnClick}
                      className="flex h-full w-full items-center justify-center rounded-md transition-all duration-200 ease-linear"
                    >
                      <Icons.uploadCloud className="h-8 w-8" />
                    </button>
                  )
                }}
              </CldUploadWidget>
            </div>
            {errors.image && (
              <p className="pt-1 text-xs text-error-solid" role="alert">
                {errors.image?.message}
              </p>
            )}
          </div>
          <div className="space-y-3">
            <Label htmlFor="description" className="text-xs">
              DESCRIPTION (optional)
            </Label>
            <Textarea
              {...register("description")}
              id={"description"}
              aria-invalid={Boolean(errors.description)}
              placeholder="Type your description here."
              onChange={(e) => {
                e.preventDefault()
                setValue("description", e.target.value, {
                  shouldValidate: true,
                })
              }}
            />
          </div>
        </form>
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
