"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"

import type { RouterOutputs } from "@builderai/api"
import { useOrganization } from "@builderai/auth"
import { cn } from "@builderai/ui"
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

import { getRandomPatternStyle } from "~/lib/generate-pattern"

export function ProjectSwitcher(props: {
  projectsPromise: Promise<RouterOutputs["project"]["listByActiveWorkspace"]>
}) {
  const router = useRouter()

  const { projects } = React.use(props.projectsPromise)
  const { organization } = useOrganization()

  const [switcherOpen, setSwitcherOpen] = React.useState(false)

  const { projectSlug } = useParams() as {
    projectSlug: string
  }

  const activeProject = projects.find((p) => p.slug === projectSlug)

  if (!projectSlug) return null
  if (!activeProject) {
    return (
      <Button
        variant="ghost"
        size="sm"
        role="combobox"
        aria-expanded={switcherOpen}
        aria-label="Select a workspace"
        className="w-52 justify-between opacity-50"
      >
        Select a project
        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0" />
      </Button>
    )
  }

  return (
    <>
      <span className="mx-4 text-lg font-bold text-muted-foreground">/</span>

      <Popover open={switcherOpen} onOpenChange={setSwitcherOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            role="combobox"
            aria-expanded={switcherOpen}
            aria-label="Select a project"
            className="relative w-52 justify-between"
          >
            <div
              style={getRandomPatternStyle(projectSlug)}
              className="absolute inset-1 opacity-25"
            />
            <span className="z-10 font-semibold">{activeProject?.name}</span>
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search project..." />

              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  onSelect={() => {
                    setSwitcherOpen(false)
                    router.push(`/${project.workspace.slug}/${project.slug}`)
                  }}
                  className="text-sm font-semibold"
                >
                  <div
                    style={getRandomPatternStyle(project.id)}
                    className="absolute inset-1 opacity-25"
                  />
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
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    router.push(`/${organization?.slug}`)
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
