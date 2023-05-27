"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { mutate } from "swr"

import { OrganizationRoles } from "@/lib/config/layout"
import { useStore } from "@/lib/stores/layout"
import { OrganizationProfiles, Profile, Project } from "@/lib/types/supabase"
import { fetchAPI } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"

export function BillingProjects({ projects }: { projects: Project[] | null }) {
  const statesProfilesRoles = {}

  // TODO: do we need to use an empty state here?
  if (!projects) {
    return null
  }

  const { orgSlug, orgId } = useStore()

  const router = useRouter()
  const changeRole = async (role: string, profileId: string) => {
    try {
      const result = await fetchAPI({
        url: `/api/org/${orgSlug}/change-role`,
        method: "POST",
        data: {
          id: orgId,
          role,
          profileId: profileId,
        },
      })

      if (result?.org_id) {
        toast({
          title: "Organization Saved",
          description: `User was changed sucessfully`,
          className: "info",
        })

        // mutate swr endpoints for org
        mutate(`/api/org`)
        mutate(`/api/org/${orgSlug}`)
        router.refresh()
      }
    } catch (e) {
      // TODO: refactor all toast with this
      const { error } = JSON.parse(e?.message ?? e)
      toast({
        title: `Error ${error?.code || ""}`,
        description: error?.message || "",
        className: "danger",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects in the Organization</CardTitle>
        <CardDescription>Add usage and tiers</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {projects.map((project) => {
          // TODO: add invitation feat
          return (
            <div
              key={project.id}
              className="flex items-center justify-between space-x-4 space-y-6"
            >
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage
                    src={`${
                      project?.logo || "https://avatar.vercel.sh/account.png"
                    }`}
                  />
                  <AvatarFallback>OM</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">
                    {project.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {project.description}
                  </p>
                </div>
                {/* TODO: create link to project billing */}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
