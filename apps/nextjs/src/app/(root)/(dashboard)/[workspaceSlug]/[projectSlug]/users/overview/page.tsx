import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@builderai/ui/table"

import { userCanAccessProject } from "~/lib/project-guard"
import { api } from "~/trpc/server-http"
import { UserActions } from "../_components/user-actions"
import { UserForm } from "../_components/user-form"

export default async function ProjectUsersPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  const { projectSlug, workspaceSlug } = props.params

  await userCanAccessProject({
    projectSlug: props.params.projectSlug,
  })

  const { users } = await api.subscription.listUsersByProject.query({
    projectSlug: props.params.projectSlug,
  })

  const { plans } = await api.plan.listByProject.query({
    projectSlug: props.params.projectSlug,
  })

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex items-center justify-end">
        <UserForm projectSlug={projectSlug} mode="create" />
      </div>
      <Table className="w-full rounded-md border bg-background-base">
        <TableHeader>
          <TableRow>
            <TableHead>User Name</TableHead>
            <TableHead>User Email</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            return (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.createdAt}</TableCell>
                <TableCell>
                  <UserActions
                    user={user}
                    projectSlug={projectSlug}
                    plans={plans}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
