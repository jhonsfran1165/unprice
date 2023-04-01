import Link from "next/link"

import type { ProjectsApiResult } from "@/lib/types/supabase"
import { timeAgo } from "@/lib/utils"
import { Card } from "@/components/shared/card"
import { Icons } from "@/components/shared/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export const ProjectCard = ({ project }: { project: ProjectsApiResult }) => {
  return (
    <Link href={`/org/${project.organization.slug}/project/${project.slug}`}>
      <Card className="hover:border-background-textContrast cursor-pointer">
        <div className="flex items-center space-x-1">
          <div className="flex-1">
            <div className="flex items-center justify-start space-x-3 px-1">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <h2 className="block truncate text-lg font-bold">
                {project.name}
              </h2>
            </div>
          </div>
        </div>
        <div className={"pt-2 h-3 pb-4"}>
          <div className={"font-semibold pl-4"}>{project.subdomain}</div>
        </div>
        <div className={"h-3 text-right pb-4"}>
          <div className={"font-semibold text-xs"}>
            {project?.created_at && timeAgo(new Date(project?.created_at))}
          </div>
        </div>
      </Card>
    </Link>
  )
}
