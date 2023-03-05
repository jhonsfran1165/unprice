import { create } from "zustand"

export const useStore = create<{
  contextHeader: string
}>((set) => ({
  contextHeader: "",
}))
