"use client"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { SubmitHandler, set, useForm } from "react-hook-form"
import { mutate } from "swr"

import { fetchAPI } from "@/lib/utils"
import {
  orgMakeDefaultSchema,
  type orgMakeDefaultType,
} from "@/lib/validations/org"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/shared/icons"

export function OrganizationMakeDefault({
  orgSlug,
  id,
  isDefault = false,
}: {
  orgSlug: string
  id: string
  isDefault?: boolean
}) {
  const router = useRouter()

  const { register, handleSubmit, setValue } = useForm<orgMakeDefaultType>({
    resolver: zodResolver(orgMakeDefaultSchema),
    defaultValues: {
      is_default: isDefault,
      id: id,
    },
  })

  const onSubmit: SubmitHandler<orgMakeDefaultType> = async (formData) => {
    try {
      const result = await fetchAPI({
        url: `/api/org/${orgSlug}/make-default`,
        method: "POST",
        data: {
          ...formData,
        },
      })

      if (result?.org_id) {
        toast({
          title: "Organization Saved",
          description: `Organization is now default`,
          className: "info",
        })

        // mutate swr endpoints for org
        mutate(`/api/org`)
        mutate(`/api/org/${orgSlug}`)
        router.refresh()
      }
    } catch (e) {
      const { error } = JSON.parse(e?.message ?? e)

      toast({
        title: `Error ${error?.code || ""}`,
        description: error?.message || "",
        className: "danger",
      })

      setValue("is_default", false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Organization</CardTitle>
        <CardDescription>
          The default organization acts as the root organization for you users,
          it is important to see it up correctly. Go to settings in the
          organization you want to make default.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form id="add-org-form" onSubmit={handleSubmit(onSubmit)}>
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="flex w-full items-center space-x-4 rounded-md border p-4">
                <Icons.help />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Enable as default
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isDefault
                      ? "This organization is default"
                      : "This organization is not default"}
                  </p>
                </div>
                <Switch
                  type={"submit"}
                  disabled={isDefault}
                  defaultChecked={isDefault}
                  onCheckedChange={(value) => {
                    setValue("is_default", value)
                  }}
                  id={"is_default"}
                  {...register("is_default")}
                />
              </div>
            </HoverCardTrigger>
            <HoverCardContent align="end" className="w-80">
              <div className="flex justify-between space-x-4">
                {isDefault ? (
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">
                      This organization is default
                    </h4>
                    <p className="text-sm font-light">
                      {
                        "You can't change a default organization. If you want to make any other organization default, you can go directly to that organization and update it as default"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">
                      Make this organization default
                    </h4>
                    <p className="text-sm font-light">
                      This action will update all your organization and will
                      update this as default
                    </p>
                  </div>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        </form>
      </CardContent>
    </Card>
  )
}
