import {
  GalleryHorizontalEnd,
  LayoutDashboard,
  MoreHorizontal,
  PlusIcon,
  Settings,
  User2,
} from "lucide-react"

import type { RouterOutputs } from "@builderai/api"
import { Button } from "@builderai/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@builderai/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@builderai/ui/dropdown-menu"
import { cn } from "@builderai/ui/utils"

import { PropagationStopper } from "~/components/prevent-propagation"
import { SuperLink } from "~/components/super-link"
import { PageForm } from "./page-form"

export function PageCard(props: {
  workspaceSlug: string
  projectSlug: string
  page: RouterOutputs["pages"]["listByActiveProject"]["pages"][number]
}) {
  const { page } = props

  return (
    <SuperLink href={`/${props.workspaceSlug}/${props.projectSlug}/pages/${page.id}`}>
      <Card className="overflow-hidden hover:border-background-borderHover">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-4">
            <CardTitle className={"line-clamp-1"}>
              <div className="flex items-center space-x-3">
                <span>{page.name}</span>
                {page.customDomain && (
                  <div className="inline-flex items-center font-secondary font-semibold text-info text-xs">
                    <span className="flex h-2 w-2 rounded-full bg-info" />
                    <span className="ml-1">{"default"}</span>
                  </div>
                )}
              </div>
            </CardTitle>
            <CardDescription className="line-clamp-2 h-10">{page.customDomain}</CardDescription>
          </div>
          <div className="flex items-center space-x-1">
            <PropagationStopper>
              <Dialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant={"ghost"}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px]" forceMount>
                    <DropdownMenuLabel>Page Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <SuperLink
                        href={`/${props.workspaceSlug}/${props.projectSlug}/pages/${page.name}/create-version`}
                        className="flex items-center"
                      >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Create version
                      </SuperLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <SuperLink
                        href={`/${props.workspaceSlug}/${props.projectSlug}/pages/${page.name}`}
                        className="flex items-center"
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </SuperLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <SuperLink
                        href={`/${props.workspaceSlug}/${props.projectSlug}/pages/${page.name}`}
                        className="flex items-center"
                      >
                        <User2 className="mr-2 h-4 w-4" />
                        Customer
                      </SuperLink>
                    </DropdownMenuItem>

                    <DialogTrigger asChild>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                    </DialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>page Form</DialogTitle>

                    <DialogDescription>Modify the page details below.</DialogDescription>
                  </DialogHeader>
                  <PageForm defaultValues={page} />
                </DialogContent>
              </Dialog>
            </PropagationStopper>
          </div>
        </CardHeader>
        <CardFooter className="flex flex-row justify-between space-x-4 text-muted-foreground text-sm">
          <span>{page.customDomain}</span>
          <GalleryHorizontalEnd className="h-4 w-4" />
        </CardFooter>
      </Card>
    </SuperLink>
  )
}

export function PageCardSkeleton(props: { pulse?: boolean }) {
  const { pulse = true } = props
  return (
    <Card>
      <div className={cn("h-20 bg-muted", pulse && "animate-pulse")} />
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className={cn("flex-1 bg-muted", pulse && "animate-pulse")}>&nbsp;</span>
        </CardTitle>
        <CardDescription className={cn("bg-muted", pulse && "animate-pulse")}>
          &nbsp;
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
