import { DashboardShell } from "~/components/dashboard-shell"
import { DeleteWorkspace } from "./delete-workspace"

// TODO: activate later. It is  hitting limits on vercel
// export const runtime = "edge"

export default function DangerZonePage() {
  return (
    <DashboardShell
      title="Danger Zone"
      description="Do dangerous stuff here"
      className="space-y-6"
    >
      <DeleteWorkspace />
    </DashboardShell>
  )
}
