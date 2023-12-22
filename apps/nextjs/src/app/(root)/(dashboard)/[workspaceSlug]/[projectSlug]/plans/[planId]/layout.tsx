import Link from "next/link"

import { Badge } from "@builderai/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"
import { ChevronLeft } from "@builderai/ui/icons"

import { DashboardShell } from "~/components/layout2/dashboard-shell"
import MaxWidthWrapper from "~/components/max-width-wrapper"
import { api } from "~/trpc/server-http"

export default async function PriceLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string; planId: string }
}) {
  const { projectSlug, workspaceSlug, planId } = props.params
  const plan = await api.plan.getById.query({
    id: planId,
  })
  return (
    <MaxWidthWrapper className="max-w-screen-2xl justify-center py-6">
      <div className="mb-6 flex justify-start align-middle">
        <Link
          className="ghost flex items-center justify-start align-middle text-sm"
          prefetch={false}
          href={`/${workspaceSlug}/${projectSlug}/plans`}
        >
          <Badge variant={"outline"} className="ghost py-1">
            <ChevronLeft className="h-4 w-4" />
            back
          </Badge>
        </Link>
      </div>
      <Card className="mb-10">
        <CardHeader className="flex flex-row items-center justify-between space-y-4 pb-2">
          <CardTitle className="flex text-2xl font-medium">
            {plan?.title.toUpperCase()}
            <span className="ml-2 flex items-center justify-center font-secondary">
              <Badge variant={"outline"}>version: latest</Badge>
            </span>
          </CardTitle>

          <CardDescription className="flex space-x-2">
            <Badge>{plan?.currency}</Badge>
            <Badge>monthly</Badge>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">Base price: $0</div>
          <p className="my-4 text-muted-foreground">
            Manage your account settings and set e-mail preferences.
          </p>
        </CardContent>
      </Card>

      <DashboardShell module="project" submodule="plans" hideTabs>
        {props.children}
      </DashboardShell>
    </MaxWidthWrapper>
  )
}
