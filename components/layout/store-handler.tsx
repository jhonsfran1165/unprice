"use client"

import { useEffect, useMemo, useRef } from "react"
import { usePathname, useSelectedLayoutSegments } from "next/navigation"

import { getActiveTabs } from "@/lib/config/dashboard"
import { useStore } from "@/lib/stores/layout"
import { AppClaims, AppModulesNav } from "@/lib/types"
import { OrganizationViewData, Session } from "@/lib/types/supabase"

function StoreHandler({
  session,
  modulesApp,
  appClaims,
}: {
  session: Session | null
  modulesApp: AppModulesNav
  appClaims: AppClaims
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

  const activeSideBar = activeTab?.sidebarNav?.find(
    (sideBar) =>
      pathname?.replace("/root", "") === sideBar.href ||
      pathname?.replace("/root", "") === activePathPrefix + sideBar.href
  )

  // TODO: how to generalize this?
  const orgSlug = numberSegments >= 1 ? cleanSegments[1] : ""
  const projectSlug = numberSegments >= 2 ? cleanSegments[3] : ""

  const orgData = useMemo(() => {
    for (var key in appClaims["organizations"]) {
      if (appClaims["organizations"][key]?.slug === orgSlug)
        return appClaims["organizations"][key]
    }
  }, [orgSlug, JSON.stringify(appClaims)])

  // TODO: use this to handle access to PRO modules inside the app
  const haveAccess = () => {
    const accessTab = orgData?.tier === activeTab?.tier || !activeTab?.tier
    const accessSideBar =
      orgData?.tier === activeSideBar?.tier || !activeSideBar?.tier

    return accessTab && accessSideBar
  }

  console.log(haveAccess())
  // initialize this only the first time from the server
  // TODO: better change this with session?
  if (!initialized.current) {
    useStore.setState({
      modulesApp,
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
      appClaims,
    })
    initialized.current = true
  }

  useEffect(() => {
    useStore.setState({
      // TODO: it is possible to generalize this?
      orgSlug,
      session,
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
      appClaims,
    })
  }, [pathname, JSON.stringify(appClaims)])

  return null
}

export default StoreHandler
