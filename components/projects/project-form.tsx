"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CldUploadWidget } from "next-cloudinary"
import { SubmitHandler, useForm } from "react-hook-form"

import { Project } from "@/lib/types/supabase"
import { createSlug, fetchAPI } from "@/lib/utils"
import { projectPostSchema, projectPostType } from "@/lib/validations/project"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/shared/icons"
import { useStore } from "@/lib/stores/layout"

export function ProjectForm({
  project,
  className,
  onSuccess
}: {
  project?: Project | null
  className?: string
  onSuccess: Function
}) {
  const { orgSlug } = useStore()

  const action = project ? "edit" : "new"

  const [data, setData] = useState<projectPostType>({
    ...(project?.id ? { id: project.id } : {}),
    name: project?.name || "",
    slug: project?.slug || "",
    description: project?.description || "",
    logo: project?.logo || "",
    custom_domain: project?.custom_domain || "",
    subdomain: project?.subdomain || "",
  })

  const [loading, setLoading] = useState(false)

  const {
    register,
    formState: { errors },
    handleSubmit,
    setValue,
    reset,
  } = useForm<projectPostType>({
    resolver: zodResolver(projectPostSchema),
    defaultValues: {
      ...data,
    },
  })

  const onSubmit: SubmitHandler<projectPostType> = async (dataForm) => {
    try {
      setLoading(true)
      const method = action === "new" ? "POST" : "PUT"

      const response = await fetchAPI({
        url: `/api/org/${orgSlug}/project`,
        method,
        data: {
          ...data,
          ...dataForm,
        },
      })

      if (response.data === 'success') {
        toast({
          title: "Organization saved",
          description: `Project created successfully`,
          className: "info",
        })

        if(onSuccess) {
          onSuccess();
        }

      } else {
        throw response
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
    <div className={className}>
      <div>
        <h3>Add new project</h3>
      </div>
      <form
        id="project-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col space-y-6 pt-6"
      >
        <div className="flex flex-col md:flex-row md:space-x-4 md:space-y-0">
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

        <div className="flex flex-col space-y-6 md:flex-row md:space-x-4 md:space-y-0">
          <div className="w-full space-y-3">
            <Label htmlFor="custom_domain" className="text-xs">
              CUSTOM DOMAIN
            </Label>
            <Input
              {...register("custom_domain")}
              id={"custom_domain"}
              aria-invalid={Boolean(errors.name)}
              className="mt-1 w-full"
              onChange={(e) => {
                setValue("custom_domain", e.target.value)
              }}
            />
            {errors.name && (
              <p className="pt-1 text-xs text-error-solid" role="alert">
                {errors.custom_domain?.message}
              </p>
            )}
          </div>

          <div className="w-full space-y-3">
            <Label htmlFor="subdomain" className="text-xs">
              SUBDOMAIN
            </Label>
            <Input
              {...register("subdomain")}
              id={"subdomain"}
              aria-invalid={Boolean(errors.name)}
              className="mt-1 w-full"
              onChange={(e) => {
                setValue("subdomain", e.target.value)
              }}
            />
            {errors.slug && (
              <p className="pt-1 text-xs text-error-solid" role="alert">
                {errors.subdomain?.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="logo" className="text-xs">
            LOGO (optional)
          </Label>
          <div className="flex h-14 w-full animate-pulse items-center justify-center space-x-2 rounded-md border-2 border-dashed">
            <CldUploadWidget
              signatureEndpoint="/api/cloudinary"
              options={{
                maxFiles: 1,
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
                  setValue("logo", secure_url, { shouldValidate: true })
                } else {
                  toast({
                    title: "Error updating image",
                    description: `Something went wrong while updating the image`,
                    className: "danger",
                  })
                }

                widget.close()
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
          {errors.logo && (
            <p className="pt-1 text-xs text-error-solid" role="alert">
              {errors.logo?.message}
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
        <div className="mt-10 flex justify-end space-x-2">
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
            disabled={loading}
            form="project-form"
            title="Submit"
            type="submit"
            className="button-primary w-28"
          >
            {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </form>
    </div>
  )
}
