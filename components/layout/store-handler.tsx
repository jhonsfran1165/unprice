"use client"

import { useEffect, useMemo, useRef } from "react"
import {
  usePathname,
  useRouter,
  useSelectedLayoutSegments,
} from "next/navigation"
import { mutate } from "swr"

import { getActiveTabs } from "@/lib/config/dashboard"
import { useTrackPage } from "@/lib/hooks/use-track-page"
import { useStore } from "@/lib/stores/layout"
import useProject from "@/lib/swr/use-project"
import { AppClaims, AppModulesNav } from "@/lib/types"
import { Session } from "@/lib/types/supabase"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/auth/supabase-provider"

// TODO: separation of concerns for this
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
  const router = useRouter()
  const segments = useSelectedLayoutSegments()
  const initialized = useRef(false)
  const { supabase } = useSupabase()

  const [page] = useTrackPage()

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

  const { project: projectData } = useProject({
    revalidateOnFocus: true,
    orgSlug,
    projectSlug,
  })

  // TODO: use this to handle access to PRO modules inside the app && permissions per roles
  const haveAccessOrg = useMemo(() => {
    const accessTab =
      orgData?.tier === activeTab?.tier ||
      !activeTab?.tier ||
      activeTab?.tier === "FREE"
    const accessSideBar =
      orgData?.tier === activeSideBar?.tier ||
      !activeSideBar?.tier ||
      activeTab?.tier === "FREE"

    return accessTab && accessSideBar
  }, [orgData?.tier, activeTab?.tier, activeSideBar?.tier])

  const haveAccessProject = useMemo(() => {
    const accessTab =
      projectData?.tier === activeTab?.tier ||
      !activeTab?.tier ||
      activeTab?.tier === "FREE"
    const accessSideBar =
      projectData?.tier === activeSideBar?.tier ||
      !activeSideBar?.tier ||
      activeTab?.tier === "FREE"

    return accessTab && accessSideBar
  }, [projectData?.tier, activeTab?.tier, activeSideBar?.tier])

  // TODO: improve this - also control this from API
  useEffect(() => {
    if (orgSlug && !haveAccessOrg) {
      toast({
        title: "PRO module",
        description: "You don't access to this module - org",
        className: "danger",
      })
    }

    if (projectSlug && !haveAccessProject) {
      toast({
        title: "PRO module",
        description: "You don't access to this module - project",
        className: "danger",
      })

      // TODO: we could use some special page for redirect
      router.push("/")
    }
  }, [haveAccessProject, haveAccessOrg, orgSlug, projectSlug])

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
      projectData,
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

    // every organization that passes until here is validated from the server to see if it belongs to the organization
    orgSlug && currentOrgClaim?.org_slug !== orgSlug && setClaimOrg()
  }, [currentOrgClaim?.org_slug, orgId, orgSlug, supabase])

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

  useEffect(() => {
    page()
  }, [pathname, JSON.stringify(appClaims)])

  useEffect(() => {
    useStore.setState({
      projectData,
    })
  }, [projectSlug, JSON.stringify(projectData)])

  return null
}

export default StoreHandler
