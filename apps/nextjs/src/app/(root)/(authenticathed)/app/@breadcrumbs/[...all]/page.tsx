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
import { cn, focusRing } from "@builderai/ui/utils"
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

  if (isSlug(workspaceSlug) || isSlug(all.at(0))) {
    baseUrl += `${workspaceSlug ?? all.at(0)}`
    // delete workspace slug from segments
    all.shift()
  }

  if (isSlug(projectSlug) || isSlug(all.at(1))) {
    baseUrl += `/${projectSlug ?? all.at(1)}`
    // delete project slug from segments
    all.shift()
  }

  // the last section is always our "BreadcrumbPage", the remaining segments are our "BreadcrumbItems":
  const breadcrumbPage = all.pop()

  return (
    <Breadcrumb className="flex h-[36px] w-full items-center">
      <BreadcrumbList>
        {all.length > 3 ? (
          <Fragment>
            <BreadcrumbItem className="border-primary">
              <BreadcrumbPage>
                <DropdownMenu>
                  <DropdownMenuTrigger className={cn(focusRing)}>
                    <BreadcrumbLink asChild>
                      <BreadcrumbEllipsis className={"text-background-solid text-xs"} />
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
                              className="text-background-solid text-xs transition-colors"
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
                {idx > 0 && <BreadcrumbSeparator className="text-background-solid text-xs" />}
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <SuperLink
                      className="text-background-solid text-xs transition-colors"
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
        {all.length > 0 && <BreadcrumbSeparator className="text-background-solid text-xs" />}
        <BreadcrumbItem>
          <BreadcrumbPage className="text-background-text text-xs">{breadcrumbPage}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
