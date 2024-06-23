import { isSlug } from "@builderai/db/utils"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@builderai/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@builderai/ui/dropdown-menu"
import { Fragment } from "react"
import { SuperLink } from "~/components/super-link"

export default function Page(props: {
  params: {
    all: string[]
  }
  searchParams: {
    workspaceSlug: string
    projectSlug: string
  }
}) {
  const { all } = props.params
  const { workspaceSlug, projectSlug } = props.searchParams

  // delete the first segment, which is always "/app"
  all.shift()

  let baseUrl = "/"

  if (isSlug(workspaceSlug)) {
    baseUrl += `${workspaceSlug}`
    // delete workspace slug from segments
    all.shift()
  }

  if (isSlug(projectSlug)) {
    baseUrl += `/${projectSlug}`
    // delete project slug from segments
    all.shift()
  }

  // the last section is always our "BreadcrumbPage", the remaining segments are our "BreadcrumbItems":
  const breadcrumbPage = all.pop()

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {all.length > 3 ? (
          <Fragment>
            <BreadcrumbItem>
              <BreadcrumbPage>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <BreadcrumbLink asChild>
                      <BreadcrumbEllipsis className="text-xs text-background-solid" />
                    </BreadcrumbLink>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {all.map((segment, idx) => {
                      const parentSegments = all.slice(0, idx)
                      const parentPath =
                        parentSegments.length > 0 ? `${parentSegments.join("/")}` : ""

                      const href = `${baseUrl}/${parentPath}/${segment}`

                      return (
                        <Fragment key={href}>
                          <DropdownMenuItem>
                            <SuperLink
                              className="transition-colors text-xs text-background-solid"
                              href={href}
                            >
                              {segment}
                            </SuperLink>
                          </DropdownMenuItem>
                        </Fragment>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </Fragment>
        ) : (
          all.map((segment, idx) => {
            const parentSegments = all.slice(0, idx)
            const parentPath = parentSegments.length > 0 ? `${parentSegments.join("/")}` : ""

            const href = `${baseUrl}/${parentPath}/${segment}`.replace(/\/\//g, "/")

            return (
              <Fragment key={href}>
                {idx > 0 && <BreadcrumbSeparator className="text-xs text-background-solid" />}
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <SuperLink
                      className="transition-colors text-xs text-background-solid"
                      href={href}
                    >
                      {segment}
                    </SuperLink>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </Fragment>
            )
          })
        )}
        {all.length > 0 && <BreadcrumbSeparator className="text-xs text-background-solid" />}
        <BreadcrumbItem>
          <BreadcrumbPage className="text-xs text-background-text">{breadcrumbPage}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
