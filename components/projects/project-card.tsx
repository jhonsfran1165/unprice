import Link from "next/link"
import { ChevronDown, Plus, Star } from "lucide-react"

import type { ProjectsApiResult } from "@/lib/types/supabase"
import { timeAgo } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

import { Icons } from "../shared/icons"

export function ProjectCard({ project }: { project: ProjectsApiResult }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>{project.slug}</CardTitle>
        </div>
        <div className="flex items-center justify-end rounded-md border">
          <Link
            href={`/org/${project.organization.slug}/project/${project.slug}`}
          >
            <Button variant={"ghost"} className="button-ghost px-2">
              <Icons.externalLink className="h-4 w-4 text-primary" />
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-[20px]" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={"ghost"} className="button-ghost px-2">
                <ChevronDown className="h-4 w-4 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              alignOffset={-5}
              className="w-[200px]"
              forceMount
            >
              <DropdownMenuLabel>Suggested Lists</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>
                Future Ideas
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>My Stack</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Inspiration</DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Plus className="mr-2 h-4 w-4" /> Create List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2">{project.description}</p>
        <div className="mt-5 flex space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Icons.cloud className="fill-sky-400 text-sky-400 mr-1 h-3 w-3" />
            {project.subdomain}
          </div>
          <div className="flex items-center">
            <Star className="mr-1 h-3 w-3" />
            10k
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-end text-xs">
        <div className="flex space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center text-xs font-light">
            Created{" "}
            {project?.created_at && timeAgo(new Date(project?.created_at))}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
