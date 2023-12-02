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

import { userCanAccessProject } from "~/lib/project-guard"
import { api } from "~/trpc/server-http"

export const runtime = "edge"
export const preferredRegion = ["fra1"]

export default async function DashboardPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  const { projectSlug } = props.params

  await userCanAccessProject({
    projectSlug,
    needsToBeInTier: ["PRO", "STANDARD"],
  })

  const { canvas } = await api.canva.listByProject.query({
    projectSlug: projectSlug,
  })

  return (
    <Table className="rounded-md border bg-background-base">
      <TableHeader>
        <TableRow>
          <TableHead>Canva ID</TableHead>
          <TableHead>Canva Slug</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Updated At</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {canvas.map((canva) => {
          return (
            <TableRow key={canva.id}>
              <TableCell>{canva.id}</TableCell>
              <TableCell>{canva.slug}</TableCell>
              <TableCell>{canva.createdAt}</TableCell>
              <TableCell>{canva.updatedAt}</TableCell>
              <TableCell>
                <Link prefetch={false} href={`/canvas/${canva.id}`}>
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
  )
}
