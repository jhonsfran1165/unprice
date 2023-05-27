"use client"

import { useEffect, useMemo, useRef } from "react"
import { usePathname, useSelectedLayoutSegments } from "next/navigation"
import { mutate } from "swr"

import { getActiveTabs } from "@/lib/config/dashboard"
import { useStore } from "@/lib/stores/layout"
import { AppClaims, AppModulesNav } from "@/lib/types"
import { Session } from "@/lib/types/supabase"
import { useSupabase } from "@/components/auth/supabase-provider"

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
  const { supabase } = useSupabase()

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
  const orgClaims = appClaims?.organizations
  const currentOrgClaim = appClaims?.current_org

  const { orgId, orgData } = useMemo(() => {
    for (const key in orgClaims) {
      if (orgClaims[key]?.slug === orgSlug) {
        return { orgId: key, orgData: orgClaims[key] }
      }
    }
  }, [orgSlug, JSON.stringify(orgClaims)]) || { orgId: "", orgData: null }

  // TODO: use this to handle access to PRO modules inside the app && permissions per roles
  const haveAccess = () => {
    const accessTab = orgData?.tier === activeTab?.tier || !activeTab?.tier
    const accessSideBar =
      orgData?.tier === activeSideBar?.tier || !activeSideBar?.tier

    return accessTab && accessSideBar
  }

  // console.log(haveAccess())
  // initialize this only the first time from the server
  // TODO: better change this with session?
  if (!initialized.current) {
    useStore.setState({
      modulesApp,
      session,
      contextHeader: activeTab?.title,
      orgSlug,
      orgId,
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
    const setClaimOrg = async () => {
      await supabase.rpc("set_my_claim", {
        claim: "current_org",
        value: { org_slug: orgSlug, org_id: orgId },
      })

      const { error } = await supabase.auth.refreshSession()
      if (error) await supabase.auth.signOut()

      mutate(`/api/org`)
      mutate(`/api/org/${orgSlug}`)
      mutate(`/api/org/${orgSlug}/project`)
    }

    // TODO: check if the orgSlug is part of the organizations of this user
    orgSlug && currentOrgClaim.org_slug !== orgSlug && setClaimOrg()
  }, [orgSlug])

  useEffect(() => {
    useStore.setState({
      // TODO: it is possible to generalize this?
      orgSlug,
      orgId,
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
