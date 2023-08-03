import { useCallback } from "react"

import { analytics } from "@/lib/analytics"
import { AnalyticEventMap } from "@/lib/types/analytics"

// avoid re creation on trackEvent on re-renders
export const useTrackEvent = () => {
  const sendEvent = useCallback(
    <K extends keyof AnalyticEventMap>(
      eventName: K,
      props: AnalyticEventMap[K]
    ) => analytics.track(eventName, props),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return [sendEvent]
}
