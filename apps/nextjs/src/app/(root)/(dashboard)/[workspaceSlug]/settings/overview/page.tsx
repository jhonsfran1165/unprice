import { Suspense } from "react"
import { notFound } from "next/navigation"

import { auth, clerkClient, UserProfile } from "@builderai/auth"

import { getActiveTenantId } from "~/lib/get-tenant"
import { OrganizationImage } from "../_components/organization-image"
import { OrganizationName } from "../_components/organization-name"
import { LoadingCard } from "../../[projectSlug]/_components/loading-card"

export const preferredRegion = ["fra1"]
export const runtime = "edge"

export default function WorkspaceSettingsPage() {
  const isOrg = getActiveTenantId().startsWith("org_")

  if (isOrg)
    return (
      // <Suspense
      //   fallback={
      //     <DashboardShell
      //       title="Organization"
      //       description="Manage your organization"
      //       module="workspace"
      //       submodule="settings"
      //       routeSlug="settings"
      //     >
      //       <Tabs defaultValue="general">
      //         <TabsList className="mb-2 w-full justify-start">
      //           <TabsTrigger value="general">General</TabsTrigger>
      //           <TabsTrigger value="members">Members</TabsTrigger>
      //         </TabsList>
      //         <TabsContent value="general" className="space-y-4">
      //           <OrganizationName orgSlug="org_123" name="" />
      //           <OrganizationImage orgSlug="org_123" name="" image="" />
      //         </TabsContent>
      //       </Tabs>
      //     </DashboardShell>
      //   }
      // >
      <OrganizationSettingsPage />
      // </Suspense>
    )

  return <UserSettingsPage />
}

async function OrganizationSettingsPage() {
  const { orgId } = auth()
  if (!orgId) notFound()

  const org = await clerkClient.organizations.getOrganization({
    organizationId: orgId,
  })

  return (
    // <DashboardShell
    //   title="Organization"
    //   description="Manage your organization"
    //   module="workspace"
    //   submodule="settings"
    //   routeSlug="settings"
    //   action={
    //     <Dialog>
    //       <DialogTrigger asChild>
    //         <Button className="self-end">Invite member</Button>
    //       </DialogTrigger>
    //       <DialogContent>
    //         <InviteMemberForm />
    //       </DialogContent>
    //     </Dialog>
    //   }
    // >
    // <Tabs defaultValue="general">
    //   <TabsList className="mb-2 w-full justify-start">
    //     <TabsTrigger value="general">General</TabsTrigger>
    //     <TabsTrigger value="members">Members</TabsTrigger>
    //   </TabsList>
    //   <TabsContent value="general" className="space-y-4">
    <Suspense fallback={<LoadingCard title="Members" description="" />}>
      <OrganizationName orgSlug={org.slug ?? org.name} name={org.name} />
      <OrganizationImage
        orgSlug={org.slug ?? org.name}
        name={org.name}
        image={org.imageUrl}
      />
    </Suspense>

    // </TabsContent>
    // <TabsContent value="members" className="flex flex-col space-y-4">
    //   <Suspense fallback={<LoadingCard title="Members" description="" />}>
    //     <OrganizationMembers
    //       membersPromise={api.workspace.listMembers.query()}
    //     />
    //   </TabsContent>
    // </Tabs>
    // </DashboardShell>
  )
}

// TODO: build this by my own or personalize
function UserSettingsPage() {
  return (
    // <DashboardShell
    //   title="Account"
    //   description="Manage your account details"
    //   module="workspace"
    //   submodule="settings"
    //   routeSlug="settings"
    // >
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
    // </DashboardShell>
  )
}
