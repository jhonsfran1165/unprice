import { ExternalLink } from "lucide-react"

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

import { api } from "~/trpc/server"

export default async function PageDomains() {
  // TODO: get limits of this project for this workspace
  const domains = await api.domains.getDomains()

  return (
    <>
      {domains.length > 0 ? (
        <div className="space-y-4">
          {domains.map((domain) => (
            <DomainCard key={domain.name} domain={domain} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DomainCardSkeleton />
          <DomainCardSkeleton />
          <DomainCardSkeleton />
        </div>
      )}
    </>
  )
}

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
  return (
    <Card>
      <CardHeader>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex flex-row items-center ">
            <CardTitle className="text-2xl font-semibold">
              {domain.name}
            </CardTitle>
            <ExternalLink className="ml-2 h-6 w-6" />
            <Badge className="ml-2" variant="secondary">
              {domain.configVerifiedAt ? "verified" : "pending verification"}
            </Badge>
          </div>

          {/* // TODO: add link */}
          <div className="flex flex-row items-center justify-between space-x-2">
            <Button variant="ghost">Refresh</Button>
            <Button>Edit</Button>
          </div>
        </div>
        <CardDescription className="mb-2 text-sm">
          Please set the following TXT record on {/* // TODO: add link */}
          <a className="text-blue-600" href="#">
            builderai.saas
          </a>{" "}
          to prove ownership of builderai.saas:
        </CardDescription>
      </CardHeader>

      <CardContent className="border-t py-4">
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
          break it. Please exercise caution when setting this record; make sure
          that the domain that is shown in the TXT verification value is
          actually the <strong>domain you want to use on Dub.co</strong> – not
          your production site.
        </p>
      </CardContent>
    </Card>
  )
}
