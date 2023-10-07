import Link from "next/link"

import { Button } from "@builderai/ui/button"

import { DashboardShell } from "~/components/dashboard-shell"
import { api } from "~/trpc/server"

export default async function WorkspaceLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  // TODO: query only for limit data
  const { limitReached } = await api.project.listByActiveWorkspace.query()

  return (
    <DashboardShell
      title="Projects"
      module="workspace"
      submodule="overview"
      action={
        limitReached ? (
          <Button className="min-w-max" variant={"ghost"}>
            Project limit reached
          </Button>
        ) : (
          <Button className="min-w-max" asChild>
            <Link href={`/onboarding`}>Create a new project</Link>
          </Button>
        )
      }
    >
      {props.children}
    </DashboardShell>
  )
}
