import Link from "next/link"

import type { ProjectsApiResult } from "@/lib/types/supabase"
import { timeAgo } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/shared/card"

export const ProjectCard = ({ project }: { project: ProjectsApiResult }) => {
  return (
    <Link href={`/org/${project.organization.slug}/project/${project.slug}`}>
      <Card className="cursor-pointer hover:border-background-textContrast">
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
        <div className={"h-3 pt-2 pb-4"}>
          <div className={"pl-4 font-semibold"}>{project.subdomain}</div>
        </div>
        <div className={"h-3 pb-4 text-right"}>
          <div className={"text-xs font-semibold"}>
            {project?.created_at && timeAgo(new Date(project?.created_at))}
          </div>
        </div>
      </Card>
    </Link>
  )
}
