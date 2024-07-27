import { format } from "date-fns"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@unprice/ui/table"

import { Fragment } from "react"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { api } from "~/trpc/server"

export default async function IngestionPage(props: {
  params: { workspaceSlug: string; projectSlug: string; ingestionId: string }
}) {
  const ingestion = await api.ingestions.byId({
    id: props.params.ingestionId,
    projectSlug: props.params.projectSlug,
  })

  return (
    <DashboardShell header={<HeaderTab title="Ingestions" />}>
      <Fragment>
        <Table>
          <TableHeader>
            <TableRow className="pointer-events-none bg-muted">
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
        <h3 className="font-medium text-lg">Schema</h3>
        <pre className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono font-semibold text-sm">
          {JSON.stringify(ingestion.schema, null, 4)}
        </pre>
      </Fragment>
    </DashboardShell>
  )
}
