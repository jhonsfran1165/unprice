import { analytics } from "@/lib/analytics"

export const useTrackPage = () => {
  return [analytics.page]
}
