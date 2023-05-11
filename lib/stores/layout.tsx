import { create } from "zustand"

import {
  AppClaims,
  AppModulesNav,
  AppOrgClaim,
  DashboardNavItem,
} from "@/lib/types"
import { OrganizationViewData, Session } from "@/lib/types/supabase"

export const useStore = create<{
  contextHeader: string
  orgSlug: string
  projectSlug: string
  session: Session | null
  modulesApp: AppModulesNav | {}
  activeTabs: DashboardNavItem[]
  activeTab: DashboardNavItem | null
  activeSegment: string
  activePathPrefix: string
  rootPathTab: string
  moduleTab: string
  numberSegments: number
  orgData: AppOrgClaim | null
  appClaims: AppClaims | null
}>((set) => ({
  contextHeader: "",
  orgSlug: "",
  projectSlug: "",
  session: null,
  modulesApp: {},
  activeTabs: [],
  activeTab: null,
  activeSegment: "",
  numberSegments: 0,
  activePathPrefix: "/",
  rootPathTab: "/",
  moduleTab: "",
  orgData: null,
  appClaims: null,
}))
