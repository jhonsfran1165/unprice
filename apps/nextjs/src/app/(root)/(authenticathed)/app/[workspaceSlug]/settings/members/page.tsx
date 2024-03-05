import { searchDataParamsSchema } from "@builderai/db/validators"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@builderai/ui/tabs"

import { DataTable } from "~/components/data-table/data-table"
import { api } from "~/trpc/server"
import { InviteMemberDialog } from "./_components/invite-member-dialog"
import { columns as columnsInvites } from "./_components/table-invites/columns"
import { columns as columnsMembers } from "./_components/table-members/columns"

export const preferredRegion = ["fra1"]
export const runtime = "edge"

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
    <div className="flex flex-col">
      <Tabs defaultValue="members" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="invites">Invites</TabsTrigger>
          </TabsList>

          <InviteMemberDialog workspaceSlug={props.params.workspaceSlug} />
        </div>

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
    </div>
  )
}
