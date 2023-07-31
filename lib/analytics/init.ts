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
// TODO: add debugger to localhost plugin to avoid verbose console
export const analytics = Analytics({
  app: "awesome-app",
  plugins: [localhostTest(), tinybirdPlugin()],
})
