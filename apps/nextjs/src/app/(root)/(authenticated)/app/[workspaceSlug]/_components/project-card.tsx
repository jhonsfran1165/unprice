import type { RouterOutputs } from "@unprice/api"
import type { ProjectTier } from "@unprice/config"
import { PROJECT_TIER } from "@unprice/config"
import { Card, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import { cn } from "@unprice/ui/utils"
import { SuperLink } from "~/components/super-link"

function ProjectTierIndicator(props: { tier: ProjectTier; isInternal?: boolean }) {
  return (
    <span
      className={cn(
        "ml-2 rounded-md px-2 py-1 text-xs no-underline group-hover:no-underline",
        props.tier === PROJECT_TIER.FREE && "bg-teal-100 dark:bg-teal-600",
        props.tier === PROJECT_TIER.STANDARD && "bg-blue-100 dark:bg-blue-800",
        props.tier === PROJECT_TIER.PRO && "bg-red-100 dark:bg-red-800"
      )}
    >
      {props.tier} {props.isInternal && " - INTERNAL"}
    </span>
  )
}

export function ProjectCard(props: {
  workspaceSlug: string
  project: RouterOutputs["projects"]["listByWorkspace"]["projects"][number]
}) {
  const { project } = props
  // TODO: fix this
  // const projectTier = (project.isInternal as ProjectTier) ?? ("FREE" as ProjectTier)
  const projectTier = "PRO"
  return (
    <SuperLink href={`/${props.workspaceSlug}/${project.slug}`}>
      <Card className="overflow-hidden">
        <div className="h-32" style={project.styles} />
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{project.name}</span>
            <ProjectTierIndicator tier={projectTier} isInternal={project.isInternal} />
          </CardTitle>
          <CardDescription>{project.url}&nbsp;</CardDescription>
        </CardHeader>
      </Card>
    </SuperLink>
  )
}

export function ProjectCardSkeleton(props: { pulse?: boolean }) {
  const { pulse = true } = props
  return (
    <Card>
      <div className={cn("h-32 bg-muted", pulse && "animate-pulse")} />
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className={cn("flex-1 bg-muted", pulse && "animate-pulse")}>&nbsp;</span>
          <ProjectTierIndicator tier={PROJECT_TIER.FREE} />
        </CardTitle>
        <CardDescription className={cn("bg-muted", pulse && "animate-pulse")}>
          &nbsp;
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
