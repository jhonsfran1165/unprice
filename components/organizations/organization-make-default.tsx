"use client"

import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { SubmitHandler, set, useForm } from "react-hook-form"
import { mutate } from "swr"

import {
  orgMakeDefaultSchema,
  type orgMakeDefaultType,
} from "@/lib/validations/org"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

export function OrganizationMakeDefault({
  orgSlug,
  id,
  isDefault = false,
}: {
  orgSlug: string
  id: number
  isDefault?: boolean
}) {
  const { toast } = useToast()
  const router = useRouter()

  const { register, handleSubmit, setValue } = useForm<orgMakeDefaultType>({
    resolver: zodResolver(orgMakeDefaultSchema),
    defaultValues: {
      is_default: isDefault,
      id: id,
    },
  })

  const onSubmit: SubmitHandler<orgMakeDefaultType> = async (orgData) => {
    try {
      const data = await fetch(`/api/org/${orgSlug}/make-default`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...orgData,
        }),
      })
      const result = await data.json()

      if (result?.org_id) {
        toast({
          title: "Organization Saved",
          description: `Organization is now default`,
          className: "bg-info-bgActive text-info-text border-info-solid",
        })

        // mutate swr endpoints for org
        mutate(`/api/org`)
        mutate(`/api/org/${orgSlug}`)
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Organization not saved",
        description: error?.message,
        className: "bg-danger-bgActive text-danger-text border-danger-solid",
      })
      setValue("is_default", false)
    }
  }

  return (
    <div className="flex flex-col space-y-6 px-4 py-5 sm:px-10">
      <h3>Default Organization</h3>
      <p className="text-sm font-light">
        The default organization acts as the root organization for you users, it
        is important to see it up correctly. Go to settings in the organization
        you want to make default.
      </p>
      <Separator className="bg-background-border" />
      <div className="flex justify-end">
        <form id="add-org-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-center space-x-2">
            <Switch
              type={"submit"}
              disabled={isDefault}
              defaultChecked={isDefault}
              onCheckedChange={(value) => {
                setValue("is_default", value)
              }}
              id={"is_default"}
              {...register("is_default")}
              className="bg-background border-background-solid ring-background-solid data-[state=unchecked]:bg-background data-[state=checked]:bg-primary-solid"
            />
            <Label htmlFor="is_default">
              {isDefault ? "Is default" : "Make default"}
            </Label>
          </div>
        </form>
      </div>
    </div>
  )
}
