"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { SubmitHandler, useForm } from "react-hook-form"
import { useDebounce } from "use-debounce"

import { createSlug } from "@/lib/utils"
import {
  orgCreatePostSchema,
  type orgCreatePostType,
} from "@/lib/validations/org"
import { Card } from "@/components/shared/card"
import { Icons } from "@/components/shared/icons"
import LoadingDots from "@/components/shared/loading/loading-dots"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

export function OrganizationForm() {
  const [signInClicked, setSignInClicked] = useState(false)
  const [noSuchAccount, setNoSuchAccount] = useState(false)
  const [keyExistsError, setKeyExistsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [orgName, setOrgName] = useState("")
  const [orgSlug, setOrgSlug] = useState("")
  const [debouncedOrgName] = useDebounce(orgName, 500)
  const [debouncedOrgSlug] = useDebounce(orgSlug, 500)
  const router = useRouter()

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

      // TODO: add profile as well
      if (newOrg.id) router.push(`/org/${newOrg.id}`)
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
      {/* TODO: create breadcrum */}
      <Card>
        <form
          id="add-org-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col space-y-4 px-4 py-8 sm:px-16"
        >
          {errorMessage ? (
            <p className="text-center text-sm text-error-solid">
              {errorMessage}
            </p>
          ) : (
            <p className="text-center text-sm text-transparent"> No errors</p>
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
          <div>
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
              <p className="text-primary-textContrast">Sign In</p>
            )}
          </Button>
        </form>
      </Card>
    </MaxWidthWrapper>
  )
}
