import { create } from "zustand"

import { AppModulesNav } from "@/lib/types"
import { OrganizationProfilesData, Session } from "@/lib/types/supabase"

export const useStore = create<{
  contextHeader: string
  orgId: number | null
  siteId: number | null
  session: Session | null
  orgProfiles: OrganizationProfilesData[]
  modulesApp: AppModulesNav
}>((set) => ({
  contextHeader: "",
  orgId: null,
  siteId: null,
  session: null,
  orgProfiles: [],
  modulesApp: {},
}))
