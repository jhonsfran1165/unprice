import { useParams, usePathname } from "next/navigation"

export function useGetPaths(): {
  baseUrl: string
  restUrl: string
  pathname: string
} {
  const params = useParams()
  const pathname = usePathname()
  const workspaceSlug = params.workspaceSlug as string
  const projectSlug = params.projectSlug as string
  let restUrl: string[] = []

  let baseUrl = ""
  if (projectSlug) {
    baseUrl = `/${workspaceSlug}/${projectSlug}`
    const [, , , ...rest] = pathname.split("/")
    restUrl = rest
  } else if (workspaceSlug) {
    baseUrl = `/${workspaceSlug}`
    const [, , ...rest] = pathname.split("/")
    restUrl = rest
  }

  return {
    baseUrl,
    restUrl: restUrl.join("/"),
    pathname,
  }
}
