import { Suspense } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@builderai/ui/tabs"

import { api } from "~/trpc/server"
import { OrganizationMembers } from "../_components/organization-members"
import { LoadingCard } from "../../[projectSlug]/_components/loading-card"

export const preferredRegion = ["fra1"]
export const runtime = "edge"

export default function WorkspaceSettingsPage({
  params,
}: {
  params: { workspaceSlug: string }
}) {
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
    <WorkspaceSettingsForm workspaceSlug={params.workspaceSlug} />
  )
  // </Suspense>
  // return <UserSettingsPage />
}

function WorkspaceSettingsForm({ workspaceSlug }: { workspaceSlug: string }) {
  return (
    <Tabs defaultValue="general">
      <TabsList className="mb-2 w-full justify-start">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="space-y-4">
        {/* <Suspense fallback={<LoadingCard title="Members" description="" />}>
      // TODO: build this by my own or personalize
      <OrganizationName
        orgSlug={workspaceData.slug}
        name={workspaceData.name}
      />
      <OrganizationImage
        orgSlug={workspaceData.slug}
        name={workspaceData.name}
        image={workspaceData.imageUrl}
      />
    </Suspense> */}
      </TabsContent>
      <TabsContent value="members" className="flex flex-col space-y-4">
        <Suspense fallback={<LoadingCard title="Members" description="" />}>
          <OrganizationMembers
            listMembersPromise={api.workspaces.listMembers({
              workspaceSlug,
            })}
          />
        </Suspense>
      </TabsContent>
    </Tabs>
  )
}

{
  /* // TODO: build this by my own or personalize
function UserSettingsPage() {
  return "dasdasd"
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
      Main card element
       card: "shadow-none bg-background-bg text-background-text",
       navbar: "hidden",
       navbarMobileMenuButton: "hidden",
       headerTitle: "hidden",
       headerSubtitle: "hidden",
     },
   }}
 />
 </DashboardShell>
} */
}
