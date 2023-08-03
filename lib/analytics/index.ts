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

/**
 * One of the most important thing in a saas is the ability to measure
 * how well is performing. The lack of analytics is always a problem
 * specially for startups that are trying to validate their product.
 * Also build a saas with good analytics is hard and depends on great measure
 * on the features and the nature of the business. That is why I used an opinionated
 * way to track events and pages views. This way you can implement your own provider
 * This library has a lot of plugins if you want to use but for me tinybird is the most
 * scalable way to do it.
 */
/* Initialize analytics & load plugins */
// TODO: add debugger to localhost plugin to avoid verbose console
export const analytics = Analytics({
  app: "builderai",
  plugins: [
    localhostTest({
      enabled: false,
    }),
    tinybirdPlugin({
      enabled: process.env.NEXT_PUBLIC_TINYBIRD_ENABLED!!,
    }),
  ],
})
