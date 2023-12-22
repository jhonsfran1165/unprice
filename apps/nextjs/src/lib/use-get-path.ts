import { useParams, usePathname } from "next/navigation"

export function useGetPaths(): {
  baseUrl: string
  restUrl: string
  pathname: string
  restSegmentsPerRoute: (route?: string) => string[]
} {
  const params = useParams()
  const pathname = usePathname()
  const workspaceSlug = params.workspaceSlug as string
  const projectSlug = params.projectSlug as string
  const ingestionId = params.ingestionId as string
  const planId = params.planId as string
  let restUrl: string[] = []

  let baseUrl = ""

  if (planId) {
    baseUrl = `/${workspaceSlug}/${projectSlug}/plans/${planId}`
    const [, , , , , ...rest] = pathname.split("/")
    restUrl = rest
  } else if (ingestionId) {
    baseUrl = `/${workspaceSlug}/${projectSlug}/${ingestionId}`
    const [, , , , , ...rest] = pathname.split("/")
    restUrl = rest
  } else if (projectSlug) {
    baseUrl = `/${workspaceSlug}/${projectSlug}`
    const [, , , ...rest] = pathname.split("/")
    restUrl = rest
  } else if (workspaceSlug) {
    baseUrl = `/${workspaceSlug}`
    const [, , ...rest] = pathname.split("/")
    restUrl = rest
  }

  // give a path segment calculate the rest of segments
  const restSegmentsPerRoute = (route?: string) =>
    restUrl.join("/").replace(`${route}/`, "").split("/")

  return {
    baseUrl,
    restUrl: restUrl.join("/"),
    pathname,
    restSegmentsPerRoute,
  }
}
