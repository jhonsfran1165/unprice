"use client"

import { useEffect, useMemo, useRef } from "react"
import { usePathname, useSelectedLayoutSegments } from "next/navigation"

import { getActiveTabs } from "@/lib/config/dashboard"
import { useStore } from "@/lib/stores/layout"
import { AppModulesNav } from "@/lib/types"
import { OrganizationProfilesData, Session } from "@/lib/types/supabase"

function StoreHandler({
  session,
  orgProfiles,
  modulesApp,
}: {
  session: Session | null
  orgProfiles: OrganizationProfilesData[]
  modulesApp: AppModulesNav
}) {
  const pathname = usePathname()
  const segments = useSelectedLayoutSegments()
  const initialized = useRef(false)

  const {
    tabs,
    activePathPrefix,
    activeSegment,
    numberSegments,
    cleanSegments,
  } = useMemo(() => {
    return getActiveTabs(segments, modulesApp)
  }, [segments, modulesApp])

  const rootPathTab =
    pathname?.replace(activePathPrefix, "") === ""
      ? "/"
      : pathname?.replace(activePathPrefix, "")

  const moduleTab =
    rootPathTab?.split("/").filter((path) => path !== "")[0] || "root"

  const activeTab = tabs.find(
    (tab) => tab.slug === `${activeSegment}-${moduleTab}`
  )

  // initialize this only the first time from the server
  // TODO: better change this with session?
  if (!initialized.current) {
    useStore.setState({ modulesApp, orgProfiles, session })
    initialized.current = true
  }

  useEffect(() => {
    useStore.setState({
      // // TODO: it is possible to generalize this?
      orgSlug: cleanSegments[1],
      projectId: parseInt(cleanSegments[3]),
      activeTabs: tabs,
      activeTab: activeTab,
      activeSegment,
      numberSegments,
      activePathPrefix,
      rootPathTab,
      moduleTab,
      contextHeader: activeTab?.title,
    })
  }, [pathname])

  return null
}

export default StoreHandler
