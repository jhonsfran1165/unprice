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
import { OrganizationForm } from "@/components/organizations/organization-form"

export function OrganizationContainer({ org }: { org?: Organization }) {
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
    setValue("image", `https://avatar.vercel.sh/${orgName}`)
  }, [orgName])

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
        <Card>
          <OrganizationForm />
        </Card>
      </div>
    </MaxWidthWrapper>
  )
}
