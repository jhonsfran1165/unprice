"use client"

import { useEffect, useMemo, useRef } from "react"
import { usePathname, useSelectedLayoutSegments } from "next/navigation"

import { getActiveTabs } from "@/lib/config/dashboard"
import { useStore } from "@/lib/stores/layout"
import { AppModulesNav } from "@/lib/types"
import { OrganizationViewData, Session } from "@/lib/types/supabase"

function StoreHandler({
  session,
  orgProfiles,
  modulesApp,
}: {
  session: Session | null
  orgProfiles: OrganizationViewData[]
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
    pathname?.replace("/root", "")?.replace(activePathPrefix, "") === ""
      ? "/"
      : pathname?.replace("/root", "")?.replace(activePathPrefix, "")

  const moduleTab =
    rootPathTab?.split("/").filter((path) => path !== "")[0] || "root"

  const activeTab = tabs.find(
    (tab) => tab.slug === `${activeSegment}-${moduleTab}`
  )

  // TODO: how to generalize this?
  const orgSlug = numberSegments >= 1 ? cleanSegments[1] : ""
  const projectSlug = numberSegments >= 2 ? cleanSegments[3] : ""

  const orgData = useMemo(
    () => orgProfiles?.find((org) => org.org_slug === orgSlug),
    [orgSlug, JSON.stringify(orgProfiles)]
  )

  // initialize this only the first time from the server
  // TODO: better change this with session?
  if (!initialized.current) {
    useStore.setState({
      modulesApp,
      orgProfiles,
      session,
      contextHeader: activeTab?.title,
      orgSlug,
      projectSlug,
      activeTabs: tabs,
      activeTab: activeTab,
      activeSegment,
      numberSegments,
      activePathPrefix,
      rootPathTab,
      moduleTab,
      orgData,
    })
    initialized.current = true
  }

  useEffect(() => {
    useStore.setState({
      // TODO: it is possible to generalize this?
      orgSlug,
      projectSlug,
      activeTabs: tabs,
      activeTab: activeTab,
      activeSegment,
      numberSegments,
      activePathPrefix,
      rootPathTab,
      moduleTab,
      contextHeader: activeTab?.title,
      orgData,
    })
  }, [pathname])

  return null
}

export default StoreHandler
