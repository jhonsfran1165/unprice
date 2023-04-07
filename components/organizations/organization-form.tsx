"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { CldUploadWidget } from "next-cloudinary"
import { SubmitHandler, useForm } from "react-hook-form"
import { useDebounce } from "use-debounce"

import { Organization } from "@/lib/types/supabase"
import { createSlug } from "@/lib/utils"
import {
  orgCreatePostSchema,
  type orgCreatePostType,
} from "@/lib/validations/org"
import BlurImage from "@/components/shared/blur-image"
import { Card } from "@/components/shared/card"
import CloudinaryUploadWidget from "@/components/shared/cloudinary"
import { Icons } from "@/components/shared/icons"
import LoadingDots from "@/components/shared/loading/loading-dots"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
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

export function OrganizationForm({ org }: { org?: Organization }) {
  const [signInClicked, setSignInClicked] = useState(false)
  const [data, setData] = useState<Organization>(org)
  const [noSuchAccount, setNoSuchAccount] = useState(false)
  const [keyExistsError, setKeyExistsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [orgName, setOrgName] = useState("")
  const [orgSlug, setOrgSlug] = useState("")
  const [debouncedOrgName] = useDebounce(orgName, 500)
  const [debouncedOrgSlug] = useDebounce(orgSlug, 500)
  const router = useRouter()

  const { toast } = useToast()
  // TODO: refine this slug can change
  // reset data when sent
  useEffect(() => {
    const slug = debouncedOrgSlug || createSlug(debouncedOrgName)

    const existOrg = async () => {
      const data = await fetch(`/api/org`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
        }),
      })

      const org = await data.json()

      if (org?.slug) {
        setKeyExistsError(true)
      }

      setValue("slug", slug, { shouldValidate: true })
    }

    setKeyExistsError(false)

    slug.length > 0 && existOrg()
  }, [debouncedOrgName, debouncedOrgSlug])

  useEffect(() => {
    setValue("image", `https://avatar.vercel.sh/${orgSlug}`)
  }, [orgSlug])

  const {
    register,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<orgCreatePostType>({
    resolver: zodResolver(orgCreatePostSchema),
    defaultValues: {
      image: "",
      slug: "",
      name: "",
      type: "",
      description: "",
      ...data,
    },
  })

  const onSubmit: SubmitHandler<orgCreatePostType> = async (orgData) => {
    try {
      setSignInClicked(true)
      const data = await fetch(`/api/org`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgData),
      })

      const newOrg = await data.json()

      // TODO: add profile as well
      if (newOrg.slug) {
        toast({
          title: "New Organization Created",
          description: `Organization ${newOrg.name} created successfully`,
          className: "bg-background-bgSubtle",
        })
        router.push(`/org/${newOrg.slug}`)
      }
      // TODO: how to close the Dialog after creation?
    } catch (error) {
      if (error instanceof Error) {
        setNoSuchAccount(true)
        setErrorMessage(error.message)
      }
    } finally {
      setSignInClicked(false)
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

      {/* TODO: make this work */}
      <div className="flex items-center justify-center">
        <Avatar className="h-28 w-28">
          <AvatarImage
            src={
              data?.image
                ? data?.image
                : `https://avatar.vercel.sh/${orgName || "new-org"}`
            }
            alt={"org photo cover"}
          />
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
            onChange={(e) => setOrgName(e.target.value)}
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
            {...register("slug")}
            id={"slug"}
            onChange={(e) => setOrgSlug(e.target.value)}
            aria-invalid={errors.slug ? "true" : "false"}
            className="mt-1 w-full"
          />
          {errors.slug && (
            <p className="text-xs pt-1 text-error-solid" role="alert">
              {errors.slug?.message}
            </p>
          )}
          {keyExistsError && (
            <p className="text-xs pt-1 text-error-solid" role="alert">
              {"the account exist"}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="type" className="text-xs">
          TYPE OF ORGANIZATION
        </Label>
        <Select
          defaultValue={data?.type}
          aria-invalid={errors.type ? "true" : "false"}
          onValueChange={(value) =>
            setValue("type", value, { shouldValidate: true })
          }
        >
          <SelectTrigger ref={{ ...register("type") }} className="w-full">
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
          IMAGE
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
            // TODO: handle error
            // onError
            onUpload={(result, widget) => {
              const {
                event,
                info: { secure_url, thumbnail_url },
              } = result

              if (event === "success") {
                setData({
                  ...data,
                  image: secure_url,
                })

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
      {/* <div>
              <Label htmlFor="image" className="text-xs">
                IMAGE
              </Label>
              <Input
                {...register("image")}
                id={"image"}
                aria-invalid={errors.image ? "true" : "false"}
                className="mt-1 w-full"
              />
              {errors.image && (
                <p className="text-xs pt-1 text-error-solid" role="alert">
                  {errors.image?.message}
                </p>
              )}
              {keyExistsError && (
                <p className="text-xs pt-1 text-error-solid" role="alert">
                  {"the account exist"}
                </p>
              )}
            </div> */}
      <div className="space-y-3">
        <Label htmlFor="description" className="text-xs">
          DESCRIPTION
        </Label>
        <Textarea
          {...register("description")}
          id={"description"}
          aria-invalid={errors.description ? "true" : "false"}
          placeholder="Type your description here."
          onChange={(e) => {
            e.preventDefault()
            console.log(e.target.value)
            setValue("description", e.target.value, { shouldValidate: true })
          }}
        />
      </div>
      <div className="flex justify-end">
        <Button
          disabled={signInClicked}
          form="add-org-form"
          title="Submit"
          type="submit"
          className="bg-primary-bg active:bg-primary-bgActive hover:bg-primary-bgHover border border-primary-border hover:border-primary-borderHover"
        >
          {signInClicked ? (
            <LoadingDots color="#808080" />
          ) : (
            <p className="hover:text-primary-textContrast text-primary-text">
              Create new organization
            </p>
          )}
        </Button>
      </div>
    </form>
  )
}
