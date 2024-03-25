import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Provider } from "jotai"
import { DollarSign, RefreshCcw } from "lucide-react"

import { Badge } from "@builderai/ui/badge"
import { ChevronLeft } from "@builderai/ui/icons"

import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import MaxWidthWrapper from "~/components/layout/max-width-wrapper"
import { api } from "~/trpc/server"
import CreateNewVersion from "../../_components/create-new-version"

export const runtime = "edge"

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
    <Provider>
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
                    {`${plan.title}: new version`}
                  </h1>
                  <h4 className="text-base text-muted-foreground">
                    {plan.description}
                  </h4>
                  <div className="flex space-x-1">
                    <Badge className="success">
                      <span className="flex h-2 w-2 rounded-full bg-success-solid" />
                      <span className="ml-1">
                        {plan.active ? "actived" : "deactived"}
                      </span>
                    </Badge>
                    <Badge className="info">
                      <DollarSign className="h-3 w-3" />
                      <span className="ml-1">{plan.currency}</span>
                    </Badge>
                    <Badge className="warning">
                      <RefreshCcw className="h-3 w-3" />
                      <span className="ml-1">{plan.billingPeriod}</span>
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-6">
                  <CreateNewVersion
                    plan={plan}
                    projectSlug={projectSlug}
                    workspaceSlug={workspaceSlug}
                  />
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
    </Provider>
  )
}
