import { Badge } from "@builderai/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@builderai/ui/card"
import { Separator } from "@builderai/ui/separator"

import { api } from "~/trpc/server"
import DragDrop from "../../_components/drag-drop"

export const runtime = "edge"

export default async function NewVersionPlanPage({
  params,
}: {
  params: {
    workspaceSlug: string
    projectSlug: string
    planSlug: string
  }
}) {
  const { projectSlug, workspaceSlug, planSlug } = params
  const { plan } = await api.plans.getBySlug({
    slug: planSlug,
  })

  return (
    <Card className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-background">
      <CardHeader className="flex flex-row items-center justify-start space-x-2 space-y-0">
        <CardTitle className="flex text-2xl font-medium">
          {`${plan?.title?.toUpperCase()}`}
        </CardTitle>

        <div className="flex flex-row items-center space-x-1">
          <Badge variant={"outline"}>{plan?.currency}</Badge>
          <Badge variant={"outline"}>monthly</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold">Base price: $0</div>
        <p className="my-4 text-muted-foreground">{plan?.description}</p>
      </CardContent>
      <Separator />
      {/* // TODO: load this with suspense */}
      <DragDrop projectSlug={projectSlug} />
    </Card>
  )
}
