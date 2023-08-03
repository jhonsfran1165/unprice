import { getDomainWithoutWWW, timezones } from "@/lib/utils"

const isServer = typeof window === "undefined"

export const tinybirdPlugin = (config = {}) => {
  let isLoaded = false

  return {
    NAMESPACE: "tinybird",
    config,
    initialize: () => {
      if (isServer) return false
      isLoaded = true
    },
    /* Track event on server and client */
    track: ({ payload: { properties, anonymousId, event } }) => {
      try {
        return fetch("/api/edge/analytics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "trackEvent",
            eventPayload: {
              event_name: event,
              session_id: anonymousId,
              payload: properties,
            },
          }),
        })
      } catch (e) {
        console.log(`Failed analytic event track: ${e}`)
      }
    },
    page: ({ payload: { properties, anonymousId } }) => {
      let country: string = "Unknown"
      let locale: string = "Unknown"

      const referer = document.referrer

      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        country = timezones[timezone]

        // TODO: replace this from locale when i18n implemented
        locale =
          navigator.languages && navigator.languages.length
            ? navigator.languages[0]
            : navigator.language || "en"
      } catch (error) {
        // ignore error
      }

      const {
        title,
        url,
        path,
        search,
        width,
        height,
        referrer,
        orgSlug,
        orgId,
        projectSlug,
        duration,
      } = properties

      // we send this data from client because from api we lost context
      const payload = {
        title,
        url,
        path,
        search,
        width,
        height,
        referrer,
        duration,
        country: country,
        locale: locale,
        session_id: anonymousId,
        referer: referer ? getDomainWithoutWWW(referer) : "(direct)",
        referer_url: referer || "(direct)",
        org_slug: orgSlug,
        org_id: orgId,
        project_slug: projectSlug,
      }

      try {
        return fetch("/api/edge/analytics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "trackPage",
            eventPayload: payload,
          }),
        })
      } catch (e) {
        console.log(`Failed analytic track: ${e}`)
      }
    },
    /* Verify script loaded */
    loaded: () => {
      return isLoaded
    },
    ready: () => {
      console.log("ready: tinybirdPlugin")
    },
  }
}
