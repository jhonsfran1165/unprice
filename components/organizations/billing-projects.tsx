import Link from "next/link"
import { ChevronDown } from "lucide-react"

import { DataProjectsView } from "@/lib/types/supabase"
import { getDateTimeLocal, getFirstAndLastDay } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Icons } from "@/components/shared/icons"

export function BillingProjects({
  projects,
}: {
  projects: DataProjectsView[] | null
}) {
  // TODO: do we need to use an empty state here?
  if (!projects) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects in the Organization</CardTitle>
        <CardDescription>Add usage and tiers</CardDescription>
      </CardHeader>
      <div className="flex items-center justify-center px-6 pb-6">
        <Separator />
      </div>
      <CardContent className="grid gap-6">
        {projects.map((project) => {
          const startDate = new Date(
            project.subscription_period_starts ?? getDateTimeLocal()
          )

          const { firstDay, lastDay } = getFirstAndLastDay(startDate.getDay())
          const billingStart = firstDay.toLocaleDateString("en-us", {
            month: "short",
            day: "numeric",
            year: "2-digit",
          })
          const billingEnd = lastDay.toLocaleDateString("en-us", {
            month: "short",
            day: "numeric",
            year: "2-digit",
          })

          return (
            <div
              key={project.project_id}
              className="flex items-center justify-between space-x-4 space-y-6"
            >
              <div className="flex w-full items-center space-x-4">
                <Avatar>
                  <AvatarImage
                    src={`${
                      project?.project_logo ||
                      "https://avatar.vercel.sh/account.png"
                    }`}
                  />
                  <AvatarFallback>OM</AvatarFallback>
                </Avatar>
                <div className="w-full">
                  <div className="flex items-center text-lg font-medium leading-none">
                    {project.project_name}
                    <Badge className="primary mx-2 h-5 text-xs">
                      {project.tier}{" "}
                    </Badge>
                  </div>
                  <div className="my-1 text-xs text-muted-foreground">
                    billing cycle:{" "}
                    <b>
                      {billingStart} - {billingEnd}
                    </b>
                  </div>
                </div>
                <div className="flex items-center justify-end rounded-md">
                  <Link
                    href={`/org/${project.org_slug}/project/${project.project_slug}`}
                  >
                    <Button
                      variant={"ghost"}
                      className="px-2  hover:bg-background-bgSubtle"
                    >
                      <Icons.externalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Separator orientation="vertical" className="h-[20px]" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={"ghost"}
                        className="px-2 hover:bg-background-bgSubtle"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" forceMount>
                      <DropdownMenuLabel>Suggested Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem className="flex pl-2">
                        <Link
                          className="flex"
                          href={`/org/${project.org_slug}/project/${project.project_slug}/settings/billing`}
                        >
                          <Icons.billing className="mr-2 h-5 w-5" />
                          Billings
                        </Link>
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem className="flex pl-2">
                        <Link
                          className="flex"
                          href={`/org/${project.org_slug}/project/${project.project_slug}/settings/billing`}
                        >
                          <Icons.plusCircle className="mr-2 h-5 w-5" />
                          Usage
                        </Link>
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem className="flex pl-2">
                        <Link
                          className="flex"
                          href={`/org/${project.org_slug}/project/${project.project_slug}/settings`}
                        >
                          <Icons.settings className="mr-2 h-5 w-5" />
                          Settings
                        </Link>
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem className="flex pl-2">
                        <Link
                          className="flex"
                          href={`/org/${project.org_slug}/project/${project.project_slug}/settings/plans`}
                        >
                          <Icons.page className="mr-2 h-5 w-5" />
                          Upgrade
                        </Link>
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
