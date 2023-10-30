import { DashboardShell } from "~/components/dashboard-shell"

export default function LoadingProjectOverview() {
  return (
    <DashboardShell title="Dashboard" module="project" submodule="overview">
      <div className="h-[600px] animate-pulse rounded-lg bg-muted"></div>
    </DashboardShell>
  )
}
