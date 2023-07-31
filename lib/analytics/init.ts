import Analytics from "analytics"

import { tinybirdPlugin } from "@/lib/analytics/tinybird-plugin"

/* This is an example plugin for testing */
const localhostTest = (userConfig = {}) => ({
  NAMESPACE: "builderai-test",
  config: userConfig,
  initialize: ({ payload }: { payload: any }) => {
    console.log("Load stuff")
  },
  page: ({ payload }: { payload: any }) => {
    console.log(`Example Page > [payload: ${JSON.stringify(payload, null, 2)}]`)
  },
  /* Track event */
  track: ({ payload }: { payload: any }) => {
    console.log(
      `Example Track > [${payload.event}] [payload: ${JSON.stringify(
        payload,
        null,
        2
      )}]`
    )
  },
  /* Identify user */
  identify: ({ payload }: { payload: any }) => {
    console.log(
      `Example identify > [payload: ${JSON.stringify(payload, null, 2)}]`
    )
  },
  loaded: () => true,
  ready: () => {
    console.log("ready: localhostTestPlugin")
  },
})

/* Initialize analytics & load plugins */
export const analytics = Analytics({
  app: "awesome-app",
  plugins: [
    localhostTest(),
    tinybirdPlugin({
      token:
        "p.eyJ1IjogIjgyM2JjODk1LTg1ODktNGZlNC1hMTRlLWQ0MmIxNjNhNjA2NCIsICJpZCI6ICJmZWUzMmQ3MS00MGZlLTRiN2YtYTg4ZS1mNjY1MjM2Y2FiNmQifQ.MCRBRA0s48yblrMcUo5Q7w0qMluQfrE4PTjaWxGT_yA",
    }),
  ],
})
