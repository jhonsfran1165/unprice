import { create } from "zustand"

import { AppModulesNav, DashboardNavItem } from "@/lib/types"
import { OrganizationProfilesData, Session } from "@/lib/types/supabase"

export const useStore = create<{
  contextHeader: string
  orgId: number | null
  projectId: number | null
  session: Session | null
  orgProfiles: OrganizationProfilesData[]
  modulesApp: AppModulesNav
  activeTabs: DashboardNavItem[]
  activeTab: DashboardNavItem | null
  activeSegment: string
  activePathPrefix: string
  rootPathTab: string
  moduleTab: string
  numberSegments: number
}>((set) => ({
  contextHeader: "",
  orgId: null,
  projectId: null,
  session: null,
  orgProfiles: [],
  modulesApp: {},
  activeTabs: [],
  activeTab: null,
  activeSegment: "",
  numberSegments: 0,
  activePathPrefix: "/",
  rootPathTab: "/",
  moduleTab: "",
}))
