"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "framer-motion"
import { CldUploadWidget } from "next-cloudinary"
import { SubmitHandler, useForm } from "react-hook-form"
import { mutate } from "swr"

import { SWIPE_REVEAL_ANIMATION_SETTINGS } from "@/lib/constants"
import { Organization } from "@/lib/types/supabase"
import { createSlug, fetchAPI } from "@/lib/utils"
import { orgPostSchema, orgPostType } from "@/lib/validations/org"
import useOrganizationExist from "@/hooks/use-organization-exist"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import LoadingDots from "@/components/shared/loading/loading-dots"
import UploadCloud from "@/components/shared/upload-cloud"

import "./styles.css"

// TODO: clean this up for a better validation of exist account - maybe better use zod
// watch elements to validate and clean errors at the same time
export function OrganizationForm({ org }: { org?: Organization }) {
  const router = useRouter()

  const action = org ? "edit" : "new"

  const [data, setData] = useState<orgPostType>({
    id: org?.id || null,
    name: org?.name || "",
    slug: org?.slug || "",
    description: org?.description || null,
    image: org?.image || "",
    type: org?.type || "personal",
  })

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

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
    setErrorMessage("")

    if (exist) {
      setError("slug", {
        type: "custom",
        message: "this organization exists",
      })
    } else {
      clearErrors("slug")
    }
  }, [exist])

  // TODO: create function for handling post errors and fetch
  const onSubmit: SubmitHandler<orgPostType> = async (dataForm) => {
    try {
      setLoading(true)
      const method = action === "new" ? "PUT" : "POST"
      const org = await fetchAPI({
        url: "/api/org",
        method,
        data: {
          ...data,
          ...dataForm,
        },
      })

      // TODO: add profile as well
      if (org.slug) {
        toast({
          title: "Organization Saved",
          description: `Organization ${org.name} Saved successfully`,
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
      setErrorMessage(error.message)

      toast({
        title: "Error deleting org",
        description: error.message,
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
        <CardHeader>
          <CardTitle className="flex text-xl">Organization</CardTitle>
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
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                className="flex w-full flex-col space-y-2"
                {...SWIPE_REVEAL_ANIMATION_SETTINGS}
              >
                <p className="text-center text-sm text-error-solid">
                  {errorMessage}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col space-y-6 md:flex-row md:space-x-4 md:space-y-0">
            <div className="w-full space-y-3">
              <Label htmlFor="name" className="text-xs">
                NAME
              </Label>
              <Input
                {...register("name")}
                id={"name"}
                aria-invalid={errors.name ? "true" : "false"}
                className="mt-1 w-full bg-background"
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
                aria-invalid={errors.slug ? "true" : "false"}
                className="mt-1 w-full bg-background"
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
              defaultValue={data?.type || "personal"}
              aria-invalid={errors.type ? "true" : "false"}
              onValueChange={(value) =>
                setValue("type", value, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Type of the organization" />
              </SelectTrigger>
              <SelectContent
                position={"popper"}
                sideOffset={2}
                className="SelectContent bg-background-bgSubtle text-background-text"
              >
                <SelectGroup>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="bussiness">Bussines</SelectItem>
                  <SelectItem value="startup">Startup</SelectItem>
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
                      className="bg-background-basetransition-all flex h-full w-full items-center justify-center rounded-md duration-200 ease-linear"
                    >
                      <UploadCloud className="h-8 w-8" />
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
              aria-invalid={errors.description ? "true" : "false"}
              placeholder="Type your description here."
              className="bg-background"
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
            {loading ? <LoadingDots color="#808080" /> : "Save"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
