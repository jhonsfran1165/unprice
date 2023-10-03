import { Suspense } from "react"
import { notFound } from "next/navigation"

import { auth, clerkClient, UserProfile } from "@builderai/auth"
import { Button } from "@builderai/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@builderai/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@builderai/ui/tabs"

import { DashboardShell } from "~/components/dashboard-shell"
import { getActiveTenantId } from "~/lib/get-tenant"
import { api } from "~/trpc/server"
import { LoadingCard } from "../[projectSlug]/_components/loading-card"
import { InviteMemberForm } from "./_components/invite-member-dialog"
import { OrganizationImage } from "./_components/organization-image"
import { OrganizationMembers } from "./_components/organization-members"
import { OrganizationName } from "./_components/organization-name"

// TODO: activate later. It is  hitting limits on vercel
// export const runtime = "edge"

export default function WorkspaceSettingsPage() {
  const isOrg = getActiveTenantId().startsWith("org_")

  if (isOrg)
    return (
      <Suspense
        fallback={
          <DashboardShell
            title="Organization"
            description="Manage your organization"
            module="workspace"
            submodule="settings"
            routeSlug="settings"
          >
            <Tabs defaultValue="general">
              <TabsList className="mb-2 w-full justify-start">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="space-y-4">
                <OrganizationName orgSlug="org_123" name="" />
                <OrganizationImage orgSlug="org_123" name="" image="" />
              </TabsContent>
            </Tabs>
          </DashboardShell>
        }
      >
        <OrganizationSettingsPage />
      </Suspense>
    )

  return <UserSettingsPage />
}

async function OrganizationSettingsPage() {
  const { orgId } = auth()
  if (!orgId) notFound()

  const org = await clerkClient.organizations.getOrganization({
    organizationId: orgId,
  })

  await new Promise((resolve) => setTimeout(resolve, 1000))

  return (
    <DashboardShell
      title="Organization"
      description="Manage your organization"
      module="workspace"
      submodule="settings"
      routeSlug="settings"
      action={
        <Dialog>
          <DialogTrigger asChild>
            <Button className="self-end">Invite member</Button>
          </DialogTrigger>
          <DialogContent>
            <InviteMemberForm />
          </DialogContent>
        </Dialog>
      }
    >
      {/* TODO: Use URL instead of clientside tabs */}
      <Tabs defaultValue="general">
        <TabsList className="mb-2 w-full justify-start">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <OrganizationName orgSlug={org.slug ?? org.name} name={org.name} />
          <OrganizationImage
            orgSlug={org.slug ?? org.name}
            name={org.name}
            image={org.imageUrl}
          />
        </TabsContent>
        <TabsContent value="members" className="flex flex-col space-y-4">
          <Suspense fallback={<LoadingCard title="Members" description="" />}>
            <OrganizationMembers
              membersPromise={api.organization.listMembers.query()}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}

// TODO: build this by my own or personalize
function UserSettingsPage() {
  return (
    <DashboardShell
      title="Account"
      description="Manage your account details"
      module="workspace"
      submodule="settings"
      routeSlug="settings"
    >
      <UserProfile
        appearance={{
          variables: {
            borderRadius: "var(--radius)",
            colorPrimary: "#ffc53d",
            colorText: "#fdfdfc",
          },
          elements: {
            // Main card element
            card: "shadow-none bg-background-bg text-background-text",
            navbar: "hidden",
            navbarMobileMenuButton: "hidden",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
          },
        }}
      />
    </DashboardShell>
  )
}
