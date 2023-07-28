"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { mutate } from "swr"

import { ORGANIZATION_ROLES } from "@/lib/config/layout"
import { useStore } from "@/lib/stores/layout"
import { OrganizationProfiles, Profile } from "@/lib/types/supabase"
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

export type MembersListProps = OrganizationProfiles & {
  profile: Profile | Profile[] | null
}

export function MembersList({
  profiles,
}: {
  profiles: MembersListProps[] | null
}) {
  const statesProfilesRoles = {}
  const { orgSlug, orgId } = useStore()
  const router = useRouter()

  profiles &&
    profiles.forEach((profile) => {
      statesProfilesRoles[profile.id] = false
    })

  const [open, setOpen] = useState(statesProfilesRoles)

  // TODO: do we need to use an empty state here?
  if (!profiles) {
    return null
  }

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
        <CardTitle>Team Members</CardTitle>
        <CardDescription>
          Invite your team members to collaborate.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <Tabs defaultValue="account" className="w-full border-none">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b border-background-border bg-background-bgSubtle">
            <TabsTrigger
              value="account"
              className="button-ghost data-[state=active]:-mb-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary-solid data-[state=inactive]:border-transparent data-[state=active]:bg-background data-[state=active]:text-background-textContrast"
            >
              Members
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="button-ghost data-[state=active]:-mb-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary-solid data-[state=inactive]:border-transparent data-[state=active]:bg-background data-[state=active]:text-background-textContrast"
            >
              Invitations
            </TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="p-6">
            {profiles.map((profile) => {
              const profileUser = profile.profile

              if (!profileUser || profileUser instanceof Array) {
                return null
              }

              // TODO: add invitation feat
              return (
                <div
                  key={profile.id}
                  className="flex items-center justify-between space-x-4 space-y-6"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage
                        src={`${
                          profileUser?.avatar_url ||
                          "https://avatar.vercel.sh/account.png"
                        }`}
                      />
                      <AvatarFallback>OM</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {profileUser.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profileUser.username}
                      </p>
                    </div>
                  </div>
                  <Popover
                    open={open[profile.id]}
                    onOpenChange={(value) => {
                      setOpen({ ...open, [profile.id]: value })
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="ml-auto"
                        aria-label="Select a role"
                        size="sm"
                      >
                        {profile.role}{" "}
                        <ChevronDown
                          className="ml-2 h-4 w-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="end">
                      <Command>
                        <CommandInput placeholder="Select new role..." />
                        <CommandList>
                          <CommandEmpty>No roles found.</CommandEmpty>
                          <CommandGroup>
                            {Object.keys(ORGANIZATION_ROLES).map(
                              (role, index) => {
                                return (
                                  <CommandItem
                                    key={role}
                                    onSelect={async () => {
                                      setOpen({ ...open, [profile.id]: false })
                                      await changeRole(role, profileUser.id)
                                    }}
                                    className="teamaspace-y-1 flex flex-col items-start px-4 py-2"
                                  >
                                    <p className="text-sm text-muted-foreground">
                                      {ORGANIZATION_ROLES[role].description}
                                    </p>
                                  </CommandItem>
                                )
                              }
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )
            })}
          </TabsContent>
          <TabsContent value="password" className="p-6">
            {"Change your password here. After saving, you'll be logged out."}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
