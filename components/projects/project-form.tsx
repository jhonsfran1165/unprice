"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { CldUploadWidget } from "next-cloudinary";
import { SubmitHandler, useForm } from "react-hook-form";
import { mutate } from "swr";
import { Organization, Project } from "@/lib/types/supabase";
import { createSlug, fetchAPI } from "@/lib/utils";
import { projectPostSchema, projectPostType } from "@/lib/validations/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Icons } from "@/components/shared/icons";

export function ProjectForm({
  project,
  orgSlug,
  className,
}: {
  project?: Project | null
  orgSlug: string
  className?: string;
}) {
  const router = useRouter()

  const action = project ? "edit" : "new"

  const [data, setData] = useState<any>({
    id: project?.id || null,
    name: project?.name || "",
    slug: project?.slug || "",
    description: project?.description || "",
    logo: project?.logo || "",
    customDomain: project?.custom_domain || "",
    subdomain: project?.subdomain || "",
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
  } = useForm<projectPostType>({
    // resolver: zodResolver(projectPostSchema),
    defaultValues: {
      ...data,
    },
  })

  const onSubmit: SubmitHandler<any> = async (dataForm) => {
    console.log(
      "🚀 ~ file: project-form.tsx:88 ~ constonSubmit:SubmitHandler<any>= ~ dataForm:",
      dataForm
    )
    // console.log("🚀 ~ file: project-form.tsx:88 ~ constonSubmit:SubmitHandler<projectPostType>= ~ dataForm:", { dataForm })
    // try {
    //   console.log("🚀 ~ file: project-form.tsx:88 ~ constonSubmit:SubmitHandler<projectPostType>= ~ dataForm:", {dataForm})
    // } catch (error) {
    //   const dataError = JSON.parse(error?.message ?? error).error

    //   toast({
    //     title: `Error ${dataError?.code ?? ""} saving project`,
    //     description: dataError.message ?? "",
    //     className: "danger",
    //   })
    // } finally {
    //   setLoading(false)
    // }
  }

  return (
    <div className={className}>
      <div>
        <h2>Add new project</h2>
      </div>
      <form
        id="project-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col space-y-6 mt-10"
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
            <Label htmlFor="name" className="text-xs">
              CUSTOM DOMAIN
            </Label>
            <Input
              {...register("customDomain")}
              id={"customDomain"}
              aria-invalid={Boolean(errors.name)}
              className="mt-1 w-full"
              onChange={(e) => {
                setValue("customDomain", e.target.value)
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
                {errors.slug?.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="image" className="text-xs">
            LOGO (optional)
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
                  setValue("logo", secure_url, { shouldValidate: true })
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
            form="add-org-form"
            title="Submit"
            // onClick={onSubmit}
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