"use client"

import { useRef } from "react"

import { useStore } from "@/lib/stores/layout"
import { AppModulesNav } from "@/lib/types"
import { OrganizationProfilesData, Session } from "@/lib/types/supabase"

function StoreInitializer({
  session,
  orgProfiles,
  modulesApp,
}: {
  session: Session | null
  orgProfiles: OrganizationProfilesData[]
  modulesApp: AppModulesNav
}) {
  const initialized = useRef(false)

  if (!initialized.current) {
    useStore.setState({ modulesApp, orgProfiles, session })
    initialized.current = true
  }

  return null
}

export default StoreInitializer
