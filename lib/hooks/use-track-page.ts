import { analytics } from "@/lib/analytics/init"

export const useTrackPage = () => {
  return [analytics.page]
}
