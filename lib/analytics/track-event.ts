import { analytics } from "@/lib/analytics"
import { AnalyticEventMap } from "@/lib/types/analytics"

// server version of use-track-event
export const trackEvent = async <K extends keyof AnalyticEventMap>(
  eventName: K,
  props: AnalyticEventMap[K]
) => {
  return await analytics.track(eventName, props)
}
