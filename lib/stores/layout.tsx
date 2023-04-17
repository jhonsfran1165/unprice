import { create } from "zustand"

import { AppModulesNav, DashboardNavItem } from "@/lib/types"
import {
  Organization,
  OrganizationViewData,
  Session,
} from "@/lib/types/supabase"

export const useStore = create<{
  contextHeader: string
  orgSlug: string
  projectSlug: string
  session: Session | null
  orgProfiles: OrganizationViewData[]
  modulesApp: AppModulesNav | {}
  activeTabs: DashboardNavItem[]
  activeTab: DashboardNavItem | null
  activeSegment: string
  activePathPrefix: string
  rootPathTab: string
  moduleTab: string
  numberSegments: number
  orgData: Organization | null
}>((set) => ({
  contextHeader: "",
  orgSlug: "",
  projectSlug: "",
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
  orgData: null,
}))
