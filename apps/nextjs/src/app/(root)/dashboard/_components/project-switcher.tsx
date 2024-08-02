"use client"

import { Badge } from "@unprice/ui/badge"
import { Button } from "@unprice/ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@unprice/ui/command"
import { Check, ChevronsUpDown, LayoutGrid } from "@unprice/ui/icons"
import { Popover, PopoverContent, PopoverTrigger } from "@unprice/ui/popover"
import { cn } from "@unprice/ui/utils"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { api } from "~/trpc/client"

export function ProjectSwitcher() {
  const router = useRouter()
  const params = useParams()

  const projectSlug = params.projectSlug as string
  const workspaceSlug = params.workspaceSlug as string

  const [data] = api.projects.listByActiveWorkspace.useSuspenseQuery(undefined, {
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  const [switcherOpen, setSwitcherOpen] = useState(false)

  const activeProject = data.projects.find((p) => p.slug === projectSlug)

  if (!projectSlug || !activeProject) return null

  return (
    <Popover open={switcherOpen} onOpenChange={setSwitcherOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={switcherOpen}
          aria-label="Select a project"
          className="w-24 sm:w-full"
        >
          <span className="truncate font-semibold">
            {activeProject.name}
            <Badge className="ml-2 font-normal" variant={"outline"}>
              {activeProject.isInternal ? "PRO - INTERNAL" : "PRO"}
            </Badge>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search project..." />
            <CommandGroup heading="All projects">
              {data.projects.map((project) => (
                <CommandItem
                  key={project.id}
                  onSelect={() => {
                    setSwitcherOpen(false)
                    router.push(`/${project.workspace.slug}/${project.slug}`)
                  }}
                  className={cn(
                    "cursor-pointer font-semibold text-sm",
                    project.id === activeProject?.id ? "bg-background-bgActive" : "bg-transparent"
                  )}
                >
                  <div className="absolute inset-1 truncate opacity-25" />
                  {project.name}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      project.id === activeProject?.id ? "opacity-100" : "opacity-0"
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
                  router.push(`/${workspaceSlug}`)
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
  )
}