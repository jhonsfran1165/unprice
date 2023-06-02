"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, Plus, Star } from "lucide-react"
import { mutate } from "swr"

import { useStore } from "@/lib/stores/layout"
import { Project } from "@/lib/types/supabase"
import { fetchAPI } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/shared/icons"

export function BillingProjects({ projects }: { projects: Project[] | null }) {
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
      <div className="flex items-center justify-center px-6 pb-6">
        <Separator />
      </div>
      <CardContent className="grid gap-6">
        {projects.map((project) => {
          // TODO: add invitation feat
          return (
            <div
              key={project.id}
              className="flex items-center justify-between space-x-4 space-y-6"
            >
              <div className="flex items-center space-x-4 w-full">
                <Avatar>
                  <AvatarImage
                    src={`${
                      project?.logo || "https://avatar.vercel.sh/account.png"
                    }`}
                  />
                  <AvatarFallback>OM</AvatarFallback>
                </Avatar>
                <div className="w-full">
                  <div className="flex items-center text-lg font-medium leading-none">
                    {project.name} {/* TODO: get tier */}
                    <Badge className="mx-2 primary h-5 text-xs">{"PRO"}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground my-1">
                    {/* TODO: add billing cycle */}
                    billing cycle: <b>15 May - 15 June, 2023</b>
                  </div>
                </div>
                {/* TODO: create link to project billing */}
                <div className="flex items-center justify-end rounded-md">
                  <Link href={`/org/project/${project.slug}`}>
                    <Button
                      variant={"ghost"}
                      className="px-2  hover:bg-background-bgSubtle"
                    >
                      <Icons.externalLink className="h-4 w-4 text-primary" />
                    </Button>
                  </Link>
                  <Separator orientation="vertical" className="h-[20px]" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={"ghost"}
                        className="px-2 hover:bg-background-bgSubtle"
                      >
                        <ChevronDown className="h-4 w-4 text-primary" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" forceMount>
                      <DropdownMenuLabel>Suggested Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem className="flex pl-2">
                        <Link className="flex" href={"/org"}>
                          <Icons.billing className="mr-2 h-5 w-5" />
                          Billings
                        </Link>
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem className="flex pl-2">
                        <Link className="flex" href={"/org"}>
                          <Icons.plusCircle className="mr-2 h-5 w-5" />
                          Usage
                        </Link>
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem className="flex pl-2">
                        <Link className="flex" href={"/org"}>
                          <Icons.settings className="mr-2 h-5 w-5" />
                          Settings
                        </Link>
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem className="flex pl-2">
                        <Link className="flex" href={"/org"}>
                          <Icons.settings className="mr-2 h-5 w-5" />
                          Upgrade
                        </Link>
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
