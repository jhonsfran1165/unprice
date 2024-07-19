import { searchDataParamsSchema } from "@unprice/db/validators"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@unprice/ui/tabs"

import { DataTable } from "~/components/data-table/data-table"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { api } from "~/trpc/server"
import { InviteMemberDialog } from "./_components/invite-member-dialog"
import { columns as columnsInvites } from "./_components/table-invites/columns"
import { columns as columnsMembers } from "./_components/table-members/columns"

export default async function WorkspaceMembersPage(props: {
  params: { workspaceSlug: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const parsed = searchDataParamsSchema.safeParse(props.searchParams)

  const filter = {
    workspaceSlug: props.params.workspaceSlug,
    fromDate: undefined as number | undefined,
    toDate: undefined as number | undefined,
  }

  if (parsed?.success) {
    filter.fromDate = parsed.data.fromDate
    filter.toDate = parsed.data.toDate
  }

  const { members } = await api.workspaces.listMembers(filter)
  const { invites } = await api.workspaces.listInvites(filter)

  return (
    <DashboardShell
      header={
        <HeaderTab
          title="Members Settings"
          description="Manage your users for this workspace"
          action={<InviteMemberDialog workspaceSlug={""} />}
        />
      }
    >
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="space-y-4">
          <DataTable
            className="mt-10"
            columns={columnsMembers}
            data={members}
            filterOptions={{
              filterBy: "name",
              filterColumns: true,
              filterDateRange: true,
            }}
          />
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          <DataTable
            className="mt-10"
            columns={columnsInvites}
            data={invites}
            filterOptions={{
              filterBy: "email",
              filterColumns: true,
              filterDateRange: true,
            }}
          />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
