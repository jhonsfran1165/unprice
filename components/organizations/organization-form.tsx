"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { CldUploadWidget } from "next-cloudinary"
import { SubmitHandler, useForm } from "react-hook-form"
import { useDebounce } from "use-debounce"

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
import { ToastAction } from "@/components/ui/toast"

export function OrganizationForm() {
  const [signInClicked, setSignInClicked] = useState(false)
  const [data, setData] = useState({})
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

  const {
    register,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<orgCreatePostType>({
    resolver: zodResolver(orgCreatePostSchema),
    defaultValues: {
      image: "https://github.com/shadcn.png",
      slug: "",
      name: "",
      type: "",
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

      toast({
        title: "New Organization Created",
        description: `Organization ${newOrg.name} created successfully`,
        className: "bg-background-bgSubtle",
      })

      // TODO: add profile as well
      if (newOrg.id) router.push(`/org/${newOrg.slug}`)
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
    <MaxWidthWrapper className="pt-10">
      <div className="grid gap-20 md:grid-cols-[250px_1fr]">
        <div className="md:flex md:w-[250px]">
          <div className="flex flex-col items-center">
            <BlurImage
              src="/_static/illustrations/undraw_folder_re_apfp.svg"
              alt="No links yet"
              width={250}
              height={250}
              priority={true}
              className="pointer-events-none mt-5 mb-10"
            />
            {/* TODO: make this work */}
            {data && data.image_url && (
              <Avatar className="rounded-lg w-full h-50">
                <AvatarImage
                  height={100}
                  src={data.image_url}
                  alt={"org photo cover"}
                />
              </Avatar>
            )}
            <h2 className="z-10 text-xl font-semibold text-base-text">
              {"Create a new organization"}
            </h2>
            <br />
            <p className="text-sm text-justify p-5 md:p-0">
              {
                "Organizations are a set of users where you can use to create new projects, they are separated from orther organizations. Billings, projects and settings are totally independet."
              }
            </p>
          </div>
        </div>
        {/* TODO: create breadcrum */}
        <Card className="">
          <form
            id="add-org-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col space-y-4 px-4 py-5 sm:px-10"
          >
            {errorMessage && (
              <p className="text-center text-sm text-error-solid">
                {errorMessage}
              </p>
            )}

            <div>
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
            <div>
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

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs">
                TYPE OF ORGANIZATION
              </Label>
              <Select
                // {...register("type")}
                aria-invalid={errors.slug ? "true" : "false"}
                onValueChange={(value) =>
                  setValue("type", value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="">
                  <SelectValue placeholder="Type of the organization" />
                </SelectTrigger>
                <SelectContent
                  position={"popper"}
                  className="w-80 bg-background-bgSubtle text-background-text"
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

            <div className="space-y-6">
              <Label htmlFor="image" className="text-xs">
                IMAGE
              </Label>
              <div className="flex h-20 justify-center items-center space-x-2 animate-pulse w-full border-2 border-dashed rounded-md">
                <CldUploadWidget
                  signatureEndpoint="/api/cloudinary"
                  options={{
                    maxFiles: 1,
                    // TODO: use avatars or something like that
                    folder: "test",
                  }}
                  onUpload={(result, widget) => {
                    const {
                      event,
                      info: { secure_url, thumbnail_url },
                    } = result

                    if (event === "success") {
                      setData({
                        ...data,
                        image_url: secure_url,
                        thumbnail_url: thumbnail_url,
                      })
                    } else {
                      toast({
                        title: "Error updating image",
                        description: `Something went wrong while updating the image`,
                        className: "bg-danger-solid text-danger-textContrast",
                      })
                    }

                    widget.close() // Close widget immediately after successful upload
                  }}
                  // uploadPreset="next-cloudinary-unsigned"
                  // onUpload={(e) =>
                  //   setData({
                  //     // ...data,
                  //     image: e.secure_url,
                  //   })
                  // }
                >
                  {({ cloudinary, widget, open }) => {
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
                <p className="w-full hover:text-primary-textContrast text-primary-text">
                  Sign In
                </p>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </MaxWidthWrapper>
  )
}
