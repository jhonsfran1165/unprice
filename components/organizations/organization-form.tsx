"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { CldUploadWidget } from "next-cloudinary"
import { SubmitHandler, useForm } from "react-hook-form"

import { Organization } from "@/lib/types/supabase"
import { createSlug } from "@/lib/utils"
import {
  orgCreatePostSchema,
  type orgCreatePostType,
} from "@/lib/validations/org"
import LoadingDots from "@/components/shared/loading/loading-dots"
import UploadCloud from "@/components/shared/upload-cloud"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
import "./styles.css"
import useOrganizationExist from "@/hooks/use-organization-exist"

export function OrganizationForm({ org }: { org?: Organization }) {
  const router = useRouter()
  const { toast } = useToast()

  const action = org ? "edit" : "new"

  const [data, setData] = useState<orgCreatePostType>({
    id: org?.id || null,
    name: org?.name || "",
    slug: org?.slug || "",
    description: org?.description || null,
    image: org?.image || null,
    type: org?.type || "",
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
  } = useForm<orgCreatePostType>({
    resolver: zodResolver(orgCreatePostSchema),
    defaultValues: {
      ...data,
    },
  })

  // watch important fields
  const watchSlug = watch("slug", "")
  const exist =
    action === "new" ? useOrganizationExist({ orgSlug: watchSlug }) : false
  const defaultImg = watchSlug
    ? `https://avatar.vercel.sh/${watchSlug}`
    : "https://avatar.vercel.sh/new-org"
  const watchImage = watch("image", defaultImg)

  useEffect(() => {
    if (exist) {
      setError("slug", {
        type: "custom",
        message: "this organization exists",
      })
    } else {
      clearErrors("slug")
    }

    if (!getValues("image")) {
      setValue("image", defaultImg)
    }
  }, [exist])

  const onSubmit: SubmitHandler<orgCreatePostType> = async (orgData) => {
    try {
      setLoading(true)
      const org = await fetch(`/api/org`, {
        method: action === "new" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          ...orgData,
        }),
      })

      const result = await org.json()

      // TODO: add profile as well
      if (result.slug) {
        toast({
          title: "Organization Saved",
          description: `Organization ${result.name} Saved successfully`,
          className: "bg-background-bgSubtle",
        })

        if (action === "new") {
          router.push(`/org/${result.slug}`)
          // Refresh the current route and fetch new data from the server without
          // losing client-side browser or React state.
          router.refresh()
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      id="add-org-form"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col space-y-6 px-4 py-5 sm:px-10"
    >
      {errorMessage && (
        <p className="text-center text-sm text-error-solid">{errorMessage}</p>
      )}

      <div className="flex items-center justify-center">
        <Avatar className="h-28 w-28">
          <AvatarImage src={watchImage || defaultImg} alt={"org photo cover"} />
        </Avatar>
      </div>

      <div className="flex justify-center items-center space-y-5 h-10">
        <Separator className="bg-background-border mx-10" />
      </div>

      <div className="flex flex-col md:flex-row space-y-6 md:space-x-4 md:space-y-0">
        <div className="space-y-3 w-full">
          <Label htmlFor="name" className="text-xs">
            NAME
          </Label>
          <Input
            {...register("name")}
            id={"name"}
            aria-invalid={errors.name ? "true" : "false"}
            className="mt-1 w-full"
            onChange={(e) => {
              setValue("name", e.target.value)
              if (action === "new") {
                setValue("slug", createSlug(e.target.value))
              }
            }}
          />
          {errors.name && (
            <p className="text-xs pt-1 text-error-solid" role="alert">
              {errors.name?.message}
            </p>
          )}
        </div>
        <div className="space-y-3 w-full">
          <Label htmlFor="slug" className="text-xs">
            SLUG
          </Label>
          <Input
            readOnly
            {...register("slug")}
            id={"slug"}
            aria-invalid={errors.slug ? "true" : "false"}
            className="mt-1 w-full"
          />
          {errors.slug && (
            <p className="text-xs pt-1 text-error-solid" role="alert">
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
          // {{ ...register("type") }}
          defaultValue={data?.type}
          aria-invalid={errors.type ? "true" : "false"}
          onValueChange={(value) =>
            setValue("type", value, { shouldValidate: true })
          }
        >
          <SelectTrigger className="w-full">
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
          <p className="text-xs pt-1 text-error-solid" role="alert">
            {errors.type?.message}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Label htmlFor="image" className="text-xs">
          IMAGE (optional)
        </Label>
        <div className="flex h-14 justify-center items-center space-x-2 animate-pulse w-full border-2 border-dashed rounded-md">
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
                className: "bg-danger-solid text-danger-textContrast",
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
                  className: "bg-danger-solid text-danger-textContrast",
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
                  className="flex w-full h-full justify-center items-center rounded-md transition-all ease-linear duration-200"
                >
                  <UploadCloud className="h-8 w-8" />
                </button>
              )
            }}
          </CldUploadWidget>
        </div>
        {errors.image && (
          <p className="text-xs pt-1 text-error-solid" role="alert">
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
          onChange={(e) => {
            e.preventDefault()
            setValue("description", e.target.value, { shouldValidate: true })
          }}
        />
      </div>
      <div className="flex justify-end space-x-2">
        {action === "new" && (
          <Button
            onClick={() => reset({ ...data })}
            title="Clear"
            className="bg-background active:bg-background-bgActive hover:bg-background-bgHover border border-background-border hover:border-background-borderHover"
          >
            <p className="hover:text-background-textContrast text-background-text">
              Clear
            </p>
          </Button>
        )}
        <Button
          disabled={loading}
          form="add-org-form"
          title="Submit"
          type="submit"
          className="bg-primary-bg active:bg-primary-bgActive hover:bg-primary-bgHover border border-primary-border hover:border-primary-borderHover"
        >
          {loading ? (
            <LoadingDots color="#808080" />
          ) : (
            <p className="hover:text-primary-textContrast text-primary-text">
              Save
            </p>
          )}
        </Button>
      </div>
    </form>
  )
}
