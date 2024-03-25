import React from "react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Provider } from "jotai"
import {
  Check,
  ChevronDown,
  DollarSign,
  GalleryHorizontalEnd,
  RefreshCcw,
} from "lucide-react"

import { cn } from "@builderai/ui"
import { Badge } from "@builderai/ui/badge"
import { Button } from "@builderai/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@builderai/ui/dropdown-menu"
import { ChevronLeft } from "@builderai/ui/icons"
import { Separator } from "@builderai/ui/separator"

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

  if (planVersionId !== "latest" && isNaN(parseInt(planVersionId))) {
    notFound()
  }

  if (planVersionId === "latest") {
    const latestVersion = plan.versions.find(
      (version) => version.latest === true
    )

    if (!latestVersion) {
      redirect(
        `/${workspaceSlug}/${projectSlug}/plans/${planSlug}/create-version`
      )
    }

    // redirect to the latest version
    redirect(
      `/${workspaceSlug}/${projectSlug}/plans/${planSlug}/${latestVersion?.version}`
    )
  }

  const activeVersion = plan.versions.find(
    (version) => version.version === Number(planVersionId)
  )

  if (!activeVersion) {
    redirect(
      `/${workspaceSlug}/${projectSlug}/plans/${planSlug}/create-version`
    )
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
                    {`${plan.title}: ${planVersionId === "version 0" ? "" : `version ${planVersionId}`}`}
                  </h1>
                  <h4 className="text-base text-muted-foreground">
                    {plan.description}
                  </h4>
                  <div className="flex space-x-2">
                    <Badge
                      className={cn({
                        success: plan.active,
                        danger: !plan.active,
                      })}
                    >
                      <span className="flex h-2 w-2 rounded-full bg-success-solid" />
                      <span className="ml-1">
                        {plan.active ? "active" : "inactive"}
                      </span>
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
                      {plan.versions.length > 0 ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button className="w-[200px]" variant="ghost">
                              <GalleryHorizontalEnd className="mr-2 h-4 w-4" />
                              {`Version V${activeVersion.version} ${activeVersion.latest ? "(latest)" : ""}`}
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-[200px]"
                          >
                            <DropdownMenuLabel>All versions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {plan.versions.map((version) => {
                              return (
                                <DropdownMenuItem key={version.id}>
                                  <Link
                                    prefetch={false}
                                    href={`/${workspaceSlug}/${projectSlug}/plans/${plan.slug}/${version.version}`}
                                    className="relative line-clamp-1 flex w-full items-center justify-between"
                                  >
                                    <span className="text-xs">
                                      {`${plan.title} - V${version.version}`}
                                      {version.latest ? " (latest)" : ""}
                                    </span>

                                    <Check
                                      className={cn(
                                        "absolute right-0 h-4 w-4",
                                        version.version ===
                                          activeVersion.version
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </Link>
                                </DropdownMenuItem>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <div className="flex items-center font-semibold">
                          No versions yet
                        </div>
                      )}
                    </div>
                    <Separator orientation="vertical" className="h-12" />
                    <div className="flex items-center justify-end space-x-6">
                      <CreateNewVersion
                        plan={plan}
                        projectSlug={projectSlug}
                        workspaceSlug={workspaceSlug}
                        planVersionId={Number(planVersionId)}
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
    </Provider>
  )
}
