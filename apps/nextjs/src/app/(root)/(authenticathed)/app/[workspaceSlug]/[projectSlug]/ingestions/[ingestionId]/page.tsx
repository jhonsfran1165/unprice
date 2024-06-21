import { format } from "date-fns"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@builderai/ui/table"

import { Fragment } from "react"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { api } from "~/trpc/server"

export const runtime = "edge"
export const preferredRegion = ["fra1"]

export default async function IngestionPage(props: {
  params: { workspaceSlug: string; projectSlug: string; ingestionId: string }
}) {
  const ingestion = await api.ingestions.byId({
    id: props.params.ingestionId,
    projectSlug: props.params.projectSlug,
  })

  return (
    <DashboardShell
      header={<HeaderTab title="Ingestions" />}
    >
      <Fragment>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted pointer-events-none">
              <TableHead>Id</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Commit</TableHead>
              <TableHead>Origin</TableHead>
              <TableHead>Parent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{ingestion.id}</TableCell>
              <TableCell>{format(ingestion.createdAt, "yyyy-MM-dd HH:mm:ss")}</TableCell>
              <TableCell>{ingestion.hash}</TableCell>
              <TableCell>{ingestion.origin}</TableCell>
              <TableCell>{ingestion.parent}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <h3 className="text-lg font-medium">Schema</h3>
        <pre className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
          {JSON.stringify(ingestion.schema, null, 4)}
        </pre>
      </Fragment>
    </DashboardShell>
  )
}
