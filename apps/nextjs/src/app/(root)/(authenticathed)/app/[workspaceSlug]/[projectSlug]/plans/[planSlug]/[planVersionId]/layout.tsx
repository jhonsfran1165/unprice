import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { DollarSign, RefreshCcw } from "lucide-react"

import { Badge } from "@builderai/ui/badge"
import { ChevronLeft } from "@builderai/ui/icons"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@builderai/ui/select"
import { Separator } from "@builderai/ui/separator"

import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import MaxWidthWrapper from "~/components/layout/max-width-wrapper"
import { api } from "~/trpc/server"
import CreateNewVersion from "../../_components/create-new-version"
import { VersionActions } from "../../_components/version-actions"

export default async function PriceLayout(props: {
  children: React.ReactNode
  params: {
    workspaceSlug: string
    projectSlug: string
    planSlug: string
    planVersionId: string
  }
}) {
  const { projectSlug, workspaceSlug, planSlug, planVersionId } = props.params
  const { plan } = await api.plans.getBySlug({
    slug: planSlug,
  })

  if (!plan) {
    notFound()
  }

  return (
    <DashboardShell
      header={
        <>
          <MaxWidthWrapper className="max-w-screen-2xl">
            <div className="mb-6 flex justify-between align-middle">
              <Link
                className="flex items-center justify-start align-middle text-sm"
                prefetch={false}
                href={`/${workspaceSlug}/${projectSlug}/plans`}
              >
                <Badge variant={"outline"} className="py-1">
                  <ChevronLeft className="h-4 w-4" />
                  back
                </Badge>
              </Link>
            </div>
          </MaxWidthWrapper>
          <HeaderTab>
            <div className="flex w-full items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-normal text-background-textContrast">
                  {`${plan.title}: ${planVersionId === "version 0" ? "" : `version ${planVersionId}`}`}
                </h1>
                <h4 className="text-base text-muted-foreground">
                  {plan.description}
                </h4>
                <div className="flex space-x-2">
                  <Badge className="success">
                    <span className="flex h-2 w-2 rounded-full bg-success-solid" />
                    <span className="ml-1">Active</span>
                  </Badge>
                  <Badge className="info">
                    <DollarSign className="h-3 w-3" />
                    <span className="ml-1">{plan.currency}</span>
                  </Badge>
                  <Badge className="warning">
                    <RefreshCcw className="h-3 w-3" />
                    <span className="ml-1">{"monthly"}</span>
                  </Badge>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-end space-x-6">
                  <div className="flex">
                    <Select defaultValue="billing">
                      <SelectTrigger id="versions" className="w-32">
                        <SelectValue placeholder="Select a version" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="team">free - v1</SelectItem>
                        <SelectItem value="billing">free - v2</SelectItem>
                        <SelectItem value="account">free - v3</SelectItem>
                        <SelectItem value="deployments">free - v4</SelectItem>
                        <SelectItem value="support">free - v5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div className="flex space-x-2">
                    <CreateNewVersion
                      plan={plan}
                      projectSlug={projectSlug}
                      workspaceSlug={workspaceSlug}
                    />
                    <VersionActions
                      planId={plan.id}
                      versionId={Number(planVersionId)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </HeaderTab>
        </>
      }
    >
      <div className="relative">
        <section>
          <div className="overflow-hidden rounded-[0.5rem] border bg-background shadow-md md:shadow-xl">
            {props.children}
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}
