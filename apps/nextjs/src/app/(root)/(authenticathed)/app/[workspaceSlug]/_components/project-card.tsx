import Link from "next/link"

import type { RouterOutputs } from "@builderai/api"
import type { ProjectTier } from "@builderai/config"
import { PROJECT_TIER } from "@builderai/config"
import { cn } from "@builderai/ui"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"

function ProjectTierIndicator(props: { tier: ProjectTier }) {
  return (
    <span
      className={cn(
        "ml-2 rounded-md px-2 py-1 text-xs no-underline group-hover:no-underline",
        props.tier === PROJECT_TIER.FREE && "bg-teal-100 dark:bg-teal-600",
        props.tier === PROJECT_TIER.STANDARD && "bg-blue-100 dark:bg-blue-800",
        props.tier === PROJECT_TIER.PRO && "bg-red-100 dark:bg-red-800"
      )}
    >
      {props.tier}
    </span>
  )
}

export function ProjectCard(props: {
  workspaceSlug: string
  project: RouterOutputs["projects"]["listByWorkspace"]["projects"][number]
}) {
  const { project } = props
  const projectTier = (project.tier as ProjectTier) ?? ("FREE" as ProjectTier)
  return (
    <Link
      prefetch={false}
      href={`/${props.workspaceSlug}/${project.slug}/overview`}
    >
      <Card className="overflow-hidden">
        <div className="h-32" style={project.styles} />
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{project.name}</span>
            <ProjectTierIndicator tier={projectTier} />
          </CardTitle>
          <CardDescription>{project.url}&nbsp;</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}

export function ProjectCardSkeleton(props: { pulse?: boolean }) {
  const { pulse = true } = props
  return (
    <Card>
      <div className={cn("bg-muted h-32", pulse && "animate-pulse")} />
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className={cn("bg-muted flex-1", pulse && "animate-pulse")}>
            &nbsp;
          </span>
          <ProjectTierIndicator tier={PROJECT_TIER.FREE} />
        </CardTitle>
        <CardDescription className={cn("bg-muted", pulse && "animate-pulse")}>
          &nbsp;
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
