import { ExternalLink, Globe } from "lucide-react"

import type { RouterOutputs } from "@builderai/api"
import { Badge } from "@builderai/ui/badge"
import { Button } from "@builderai/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@builderai/ui/table"

import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { api } from "~/trpc/server"
import DomainConfiguration from "./_components/domain-configuration"
import { DomainDialog } from "./_components/domain-dialog"

export default async function PageDomains() {
  const domains = await api.domains.getDomains()

  return (
    <>
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
                <DomainDialog />
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
    </>
  )
}

// TODO: fix this
export function DomainCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <ExternalLink className="h-6 w-6" />
          <div className="space-y-1.5">
            <CardTitle>shadcn.com</CardTitle>
            <CardDescription>shadcn.com</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-background-bg p-4"></div>
      </CardContent>
      <CardFooter>dasdasdsad</CardFooter>
    </Card>
  )
}

const DomainCard = ({
  domain,
}: {
  domain: RouterOutputs["domains"]["getDomains"][number]
}) => {
  const domainVerified = !!domain.verified

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-row items-center ">
            <CardTitle className="text-2xl font-semibold">
              {domain.name}
            </CardTitle>

            <a href={`https://${domain.name}`} target="_blank" rel="noreferrer">
              <ExternalLink className="ml-2 h-5 w-5" />
            </a>
            <Badge
              className="ml-2"
              variant={domainVerified ? "outline" : "secondary"}
            >
              {domainVerified ? "verified" : "pending verification"}
            </Badge>
          </div>

          {/* // TODO: add link */}
          <div className="flex flex-row items-center justify-between space-x-2">
            {!domainVerified && <Button variant="ghost">Refresh</Button>}
            <Button>Edit</Button>
          </div>
        </div>
        {!domainVerified && (
          <CardDescription className="my-6 text-sm">
            Please set the following TXT record on {/* // TODO: add link */}
            <a className="text-blue-600" href={domain.name}>
              builderai.saas
            </a>{" "}
            to prove ownership of builderai.saas:
          </CardDescription>
        )}
      </CardHeader>

      {!domainVerified && (
        <CardContent className="border-t py-4">
          <DomainConfiguration domain={domain.name} />
          <Table className="my-4 rounded bg-background-bg">
            <TableBody>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Value</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">TXT</TableCell>
                <TableCell className="font-medium">_vercel</TableCell>
                <TableCell className="font-medium">
                  vc-domain-verify=builderai.saas,abb86abd11c3eefdb09
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="mt-4 text-sm font-normal">
            Warning: if you are using this domain for another site, setting this
            TXT record will transfer domain ownership away from that site and
            break it. Please exercise caution when setting this record; make
            sure that the domain that is shown in the TXT verification value is
            actually the <strong>domain you want to use on Dub.co</strong> – not
            your production site.
          </p>
        </CardContent>
      )}
    </Card>
  )
}
