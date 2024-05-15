import Link from "next/link"
import {
  GalleryHorizontalEnd,
  LayoutDashboard,
  MoreHorizontal,
  PlusIcon,
  Settings,
  User2,
} from "lucide-react"

import { cn } from "@builderai/ui"
import { Button } from "@builderai/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@builderai/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@builderai/ui/dropdown-menu"

import { PropagationStopper } from "~/components/prevent-propagation"
import type { RouterOutputs } from "~/trpc/shared"
import { PlanForm } from "../../_components/plan-form"

export function PlanCard(props: {
  workspaceSlug: string
  projectSlug: string
  plan: RouterOutputs["plans"]["listByActiveProject"]["plans"][number]
}) {
  const { plan } = props
  const { versions, ...rest } = plan

  return (
    <Link
      prefetch={false}
      href={`/${props.workspaceSlug}/${props.projectSlug}/plans/${plan.slug}`}
    >
      <Card className="overflow-hidden hover:border-background-borderHover">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-4">
            <CardTitle className={"line-clamp-1"}>
              <div className="flex items-center space-x-3">
                <span>{plan.slug}</span>
                {plan.defaultPlan && (
                  <div className="inline-flex items-center font-secondary text-xs font-semibold text-info">
                    <span className="flex h-2 w-2 rounded-full bg-info" />
                    <span className="ml-1">{"default"}</span>
                  </div>
                )}
              </div>
            </CardTitle>
            <CardDescription className="line-clamp-2 h-10">
              {plan.description}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-1 ">
            <PropagationStopper>
              <Dialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant={"ghost"}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[200px]"
                    forceMount
                  >
                    <DropdownMenuLabel>Plan Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link
                        href={`/${props.workspaceSlug}/${props.projectSlug}/plans/${plan.slug}/create-version`}
                        className="flex items-center"
                      >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Create version
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link
                        href={`/${props.workspaceSlug}/${props.projectSlug}/plans/${plan.slug}`}
                        className="flex items-center"
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link
                        href={`/${props.workspaceSlug}/${props.projectSlug}/plans/${plan.slug}`}
                        className="flex items-center"
                      >
                        <User2 className="mr-2 h-4 w-4" />
                        Customer
                      </Link>
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
                  <PlanForm defaultValues={rest} />
                </DialogContent>
              </Dialog>
            </PropagationStopper>
          </div>
        </CardHeader>
        <CardFooter className="flex flex-row justify-between space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center text-xs text-muted-foreground">
            <GalleryHorizontalEnd className="mr-2 h-3 w-3" />
            {versions.length === 0 ? "no" : versions.length} versions
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

export function PlanCardSkeleton(props: { pulse?: boolean }) {
  const { pulse = true } = props
  return (
    <Card>
      <div className={cn("h-20 bg-muted", pulse && "animate-pulse")} />
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className={cn("flex-1 bg-muted", pulse && "animate-pulse")}>
            &nbsp;
          </span>
        </CardTitle>
        <CardDescription className={cn("bg-muted", pulse && "animate-pulse")}>
          &nbsp;
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
