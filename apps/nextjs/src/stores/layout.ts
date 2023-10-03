import { observable } from "@legendapp/state"

export interface Layout {
  workspaceSlug: string
  projectSlug: string
}

export const layoutState = observable<Layout>({
  workspaceSlug: "",
  projectSlug: "",
})
