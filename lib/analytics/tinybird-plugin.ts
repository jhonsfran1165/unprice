import { getDomainWithoutWWW, timezones } from "@/lib/utils"
import { newId } from "@/lib/utils/id"

const isServer = typeof window === "undefined"

const config = {
  token: null,
  baseUrl: "https://api.tinybird.co",
  globalScript: "Tinybird",
}

export const tinybirdPlugin = (pluginConfig = {}) => {
  let isLoaded = false

  return {
    NAMESPACE: "tinybird",
    config: {
      ...config,
      ...pluginConfig,
    },
    initialize: () => {
      if (isServer) return false
      isLoaded = true
    },
    /* Track event on server and client */
    // TODO: move all this to and edge enpoint so we can track pages and more
    track: ({ payload }: { payload: any }) => {},
    page: ({ payload }) => {
      let country, locale
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

      const time = Date.now()
      const pageViewId = newId("page")
      const referer = document.referrer

      // TODO: add route parameters like segments
      const pageViewObject = {
        ...payload.properties, // TODO: get properties explicitly
        id: pageViewId,
        time,
        href: window.location.href,
        timestamp: new Date(time).toISOString(),
        domain: window.location.host || "Unknown",
        subdomain: window.location.host.split(".")[0] || "Unknown",
        country: country || "Unknown",
        locale: locale || "Unknown",
        session_id: payload.anonymousId,
        referer: referer ? getDomainWithoutWWW(referer) : "(direct)",
        referer_url: referer || "(direct)",
      }

      try {
        return fetch("/api/edge/analytics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pageViewObject),
        })
      } catch (e) {
        console.log(`Failed to log to Dub Slack. Error: ${e}`)
      }
    },
    /* Verify script loaded */
    loaded: () => {
      return true
    },
    ready: () => {
      console.log("ready: localhostTestPlugin")
    },
  }
}
