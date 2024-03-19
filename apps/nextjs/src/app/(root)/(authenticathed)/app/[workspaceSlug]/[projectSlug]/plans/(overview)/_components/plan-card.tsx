import Link from "next/link"
import {
  ChevronDownIcon,
  EyeIcon,
  GalleryHorizontalEnd,
  LayoutDashboard,
  PlusIcon,
  Settings,
  User2,
} from "lucide-react"

import { cn } from "@builderai/ui"
import { Button, buttonVariants } from "@builderai/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import { Separator } from "@builderai/ui/separator"

import type { RouterOutputs } from "~/trpc/shared"
import { PlanForm } from "../../_components/plan-form"

export function PlanCard(props: {
  workspaceSlug: string
  projectSlug: string
  plan: RouterOutputs["plans"]["listByActiveProject"]["plans"][number]
}) {
  const { plan } = props

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-2">
          <CardTitle className={"line-clamp-1"}>{plan.title}</CardTitle>
          <CardDescription className="line-clamp-4 h-20">
            {plan.description}
          </CardDescription>
        </div>
        <div className="button-primary flex items-center space-x-1 rounded-md ">
          <Link
            href={`/${props.workspaceSlug}/${props.projectSlug}/plans/${plan.slug}/latest`}
            className={buttonVariants({ variant: "custom" })}
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            versions
          </Link>
          <Separator orientation="vertical" className="h-[20px] p-0" />

          <Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={"custom"}>
                  <ChevronDownIcon className="h-4 w-4" />
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
                    href={`/${props.workspaceSlug}/${props.projectSlug}/plans/${plan.slug}/0`}
                    className="flex items-center"
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    latest version
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
              <PlanForm
                defaultValues={
                  plan ?? {
                    title: "",
                    slug: "",
                    description: "",
                    type: "recurring",
                    billingPeriod: "monthly",
                    startCycle: "1",
                    currency: "USD",
                    gracePeriod: 0,
                  }
                }
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <GalleryHorizontalEnd className="mr-1 h-3 w-3" />
            {plan.versions.length === 0 ? "No" : plan.versions.length} Versions
          </div>

          <div>Updated April 2023</div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PlanCardSkeleton(props: { pulse?: boolean }) {
  const { pulse = true } = props
  return (
    <Card>
      <div className={cn("h-32 bg-muted", pulse && "animate-pulse")} />
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
