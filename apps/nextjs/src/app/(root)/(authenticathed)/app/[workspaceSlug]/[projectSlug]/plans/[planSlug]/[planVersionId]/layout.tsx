import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@builderai/ui/badge"
import { ChevronLeft } from "@builderai/ui/icons"

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
              <div className="flex items-center justify-end space-x-2">
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
          </MaxWidthWrapper>
          <HeaderTab
            title="New version"
            description="Create a new version for this plan"
          />
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
