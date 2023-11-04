"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"

import type { RouterOutputs } from "@builderai/api"
import { useOrganization } from "@builderai/auth"
import { Button } from "@builderai/ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@builderai/ui/command"
import { Check, ChevronsUpDown, LayoutGrid } from "@builderai/ui/icons"
import { Popover, PopoverContent, PopoverTrigger } from "@builderai/ui/popover"
import { cn } from "@builderai/ui/utils"

import { apiRQ } from "~/trpc/client"
import { ProjectSwitcherSkeleton } from "./project-switcher-skeleton"

export function ProjectSwitcher(props: {
  activeProjects: RouterOutputs["project"]["listByActiveWorkspace"]
}) {
  const router = useRouter()

  const { data, isFetching } = apiRQ.project.listByActiveWorkspace.useQuery(
    undefined,
    {
      initialData: props.activeProjects,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  )
  const { organization } = useOrganization()

  const [switcherOpen, setSwitcherOpen] = useState(false)

  const params = useParams()

  const projectSlug = params.projectSlug as string

  const activeProject = data.projects.find((p) => p.slug === projectSlug)

  if (!projectSlug) return null

  if (!activeProject || isFetching) {
    return <ProjectSwitcherSkeleton />
  }

  return (
    <>
      <span className="mx-4 hidden text-lg font-bold text-muted-foreground md:block">
        /
      </span>

      <Popover open={switcherOpen} onOpenChange={setSwitcherOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            role="combobox"
            aria-expanded={switcherOpen}
            aria-label="Select a project"
            className="relative w-32 justify-between md:w-44"
          >
            <div className="absolute inset-1 opacity-25" />
            <span className="z-10 font-semibold">{activeProject?.name}</span>
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search project..." />
              <CommandGroup heading="All projects">
                {data.projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    onSelect={() => {
                      setSwitcherOpen(false)
                      router.push(
                        `/${project.workspace.slug}/${project.slug}/overview`
                      )
                    }}
                    className={cn(
                      "cursor-pointer text-sm font-semibold",
                      project.id === activeProject?.id
                        ? "bg-background-bgActive"
                        : "bg-transparent"
                    )}
                  >
                    <div className="absolute inset-1 opacity-25" />
                    {project.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        project.id === activeProject?.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    router.push(`/${organization?.slug}/overview`)
                    setSwitcherOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <LayoutGrid className="mr-2 h-5 w-5" />
                  Browse projects
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}
