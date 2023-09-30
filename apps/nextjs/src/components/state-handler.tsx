"use client"

import { useEffect, useRef } from "react"
import { useParams, useSelectedLayoutSegments } from "next/navigation"
import { enableReactComponents } from "@legendapp/state/config/enableReactComponents"
import { enableReactUse } from "@legendapp/state/config/enableReactUse"
import {
  configureObservablePersistence,
  persistObservable,
} from "@legendapp/state/persist"
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage"

import { useCanRender } from "~/lib/use-can-render"
import { layoutState } from "~/stores/layout"

enableReactComponents()
enableReactUse() // This adds the use() function to observables

// Global configuration
configureObservablePersistence({
  // Use Local Storage
  pluginLocal: ObservablePersistLocalStorage,
})

export function LegendStateHandler() {
  const canRender = useCanRender()
  const initialized = useRef(false)
  const { workspaceSlug, projectSlug } = useParams() as {
    workspaceSlug: string
    projectSlug: string
  }

  // just need the path of the current module
  const ignoredRoutes = [
    "(dashboard)",
    "(auth)",
    "root",
    workspaceSlug,
    projectSlug,
  ]

  const segments = useSelectedLayoutSegments()

  const cleanSegments = segments.filter(
    (segment) => !ignoredRoutes.includes(segment)
  )

  useEffect(() => {
    layoutState.workspaceSlug.set(workspaceSlug)
    layoutState.projectSlug.set(projectSlug)
    layoutState.activeSegments.set(cleanSegments)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, projectSlug, cleanSegments.join(",")])

  // configure persistance only once
  if (!initialized.current && canRender) {
    // Persist this observable
    persistObservable(layoutState, {
      local: "layoutState", // Unique name
    })
    initialized.current = true
  }

  return null
}
