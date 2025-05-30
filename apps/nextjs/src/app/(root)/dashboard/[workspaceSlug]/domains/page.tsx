import { ExternalLink, Globe } from "lucide-react"
import { Suspense } from "react"

import type { RouterOutputs } from "@unprice/trpc"
import { Badge } from "@unprice/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@unprice/ui/card"

import { FEATURE_SLUGS } from "@unprice/config"
import { Button } from "@unprice/ui/button"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import UpgradePlanError from "~/components/layout/error"
import HeaderTab from "~/components/layout/header-tab"
import { entitlementFlag } from "~/lib/flags"
import { api } from "~/trpc/server"
import DomainConfiguration from "./_components/domain-configuration"
import { DomainDialog } from "./_components/domain-dialog"
import { VerifyDomainButton } from "./_components/domain-verify-button"

export default async function PageDomains() {
  const isDomainsEnabled = await entitlementFlag(FEATURE_SLUGS.DOMAINS)

  if (!isDomainsEnabled) {
    return <UpgradePlanError />
  }

  const { domains } = await api.domains.getAllByActiveWorkspace()

  return (
    <DashboardShell
      header={
        <HeaderTab
          title="Domains"
          description="Domains for this workspace"
          action={
            <DomainDialog>
              <Button>Create Domain</Button>
            </DomainDialog>
          }
        />
      }
    >
      {domains.length === 0 ? (
        <Card>
          <CardContent className="my-0 p-6">
            <EmptyPlaceholder>
              <EmptyPlaceholder.Icon>
                <Globe className="h-8 w-8" />
              </EmptyPlaceholder.Icon>
              <EmptyPlaceholder.Title>No domains</EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>
                There are no domains for the workspace.
              </EmptyPlaceholder.Description>
              <EmptyPlaceholder.Action>
                <DomainDialog>
                  <Button size={"sm"}>Create Domain</Button>
                </DomainDialog>
              </EmptyPlaceholder.Action>
            </EmptyPlaceholder>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-4">
          {domains.map((domain) => (
            <li key={domain.name}>
              <DomainCard key={domain.name} domain={domain} />
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  )
}

const DomainCard = ({
  domain,
}: {
  domain: RouterOutputs["domains"]["getAllByActiveWorkspace"]["domains"][number]
}) => {
  const domainVerified = !!domain.verified

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-row items-center">
            <CardTitle className="font-semibold text-2xl">{domain.name}</CardTitle>

            <a href={`https://${domain.name}`} target="_blank" rel="noreferrer">
              <ExternalLink className="ml-2 h-5 w-5" />
            </a>
            <Badge className="ml-2" variant={domainVerified ? "outline" : "secondary"}>
              {domainVerified ? "verified" : "pending verification"}
            </Badge>
          </div>

          <div className="flex flex-row items-center justify-between space-x-2">
            <VerifyDomainButton domain={domain.name} />
            <DomainDialog defaultValues={domain}>
              <Button variant={"default"}>Edit Domain</Button>
            </DomainDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="border-t py-4">
        <Suspense fallback={<DomainConfiguration.Skeleton />}>
          <DomainConfiguration domainPromise={api.domains.verify({ domain: domain.name })} />
        </Suspense>
      </CardContent>
    </Card>
  )
}
