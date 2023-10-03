import { useParams } from "next/navigation"

export function useGetPaths(): string {
  const params = useParams()

  const workspaceSlug = params.workspaceSlug as string
  const projectSlug = params.projectSlug as string

  let activePathPrefix = ""
  if (projectSlug) {
    activePathPrefix = `/${workspaceSlug}/${projectSlug}`
  } else if (workspaceSlug) {
    activePathPrefix = `/${workspaceSlug}`
  }

  return activePathPrefix
}
