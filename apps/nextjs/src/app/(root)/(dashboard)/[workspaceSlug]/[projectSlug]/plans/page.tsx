import Link from "next/link"

import { Button } from "@builderai/ui/button"
import { Eye } from "@builderai/ui/icons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@builderai/ui/table"

import { DashboardShell } from "~/components/layout2/dashboard-shell"
import { userCanAccessProject } from "~/lib/project-guard"
import { api } from "~/trpc/server-http"
import { NewPlanDialog } from "./_components/new-plan"

export default async function PlansPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  const { projectSlug, workspaceSlug } = props.params

  await userCanAccessProject({
    projectSlug,
    needsToBeInTier: ["PRO", "STANDARD", "FREE"],
  })

  const { plans } = await api.plan.listByProject.query({
    projectSlug: projectSlug,
  })
  return (
    <DashboardShell
      title="Plans"
      module="project"
      submodule="plans"
      action={<NewPlanDialog />}
    >
      <Table className="rounded-md border bg-background-base">
        <TableHeader>
          <TableRow>
            <TableHead>Plans ID</TableHead>
            <TableHead>Plans Slug</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Updated At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => {
            return (
              <TableRow key={plan.id}>
                <TableCell>{plan.id}</TableCell>
                <TableCell>{plan.slug}</TableCell>
                <TableCell>{plan.createdAt}</TableCell>
                <TableCell>{plan.updatedAt}</TableCell>
                <TableCell>
                  <Link
                    prefetch={false}
                    href={`/${workspaceSlug}/${projectSlug}/plans/${plan.id}/overview`}
                  >
                    <Button className="min-w-max">
                      <Eye className="h-5 w-5" />
                      <span className="pl-2">View</span>
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </DashboardShell>
  )
}
