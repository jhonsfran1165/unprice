import { env } from "cloudflare:workers"
import { getToken } from "@auth/core/jwt"
import { partyserverMiddleware } from "hono-party"
import { cors } from "hono/cors"
import type { Env } from "~/env"
import { newApp } from "~/hono/app"
import { init } from "~/middleware/init"

import serveEmojiFavicon from "stoker/middlewares/serve-emoji-favicon"

export { DurableObjectUsagelimiter } from "~/entitlement/do"

import { registerReportUsageV1 } from "~/routes/customer/reportUsageV1"
import { registerCanV1 } from "./routes/customer/canV1"
import { registerCreatePaymentMethodV1 } from "./routes/customer/createPaymentMethodV1"
import { registerGetActivePhaseV1 } from "./routes/customer/getActivePhaseV1"
import { registerGetEntitlementsV1 } from "./routes/customer/getEntitlementsV1"
import { registerGetPaymentMethodsV1 } from "./routes/customer/getPaymentMethodsV1"
import { registerGetSubscriptionV1 } from "./routes/customer/getSubscriptionV1"
import { registerGetUsageV1 } from "./routes/customer/getUsageV1"
import { registerResetEntitlementsV1 } from "./routes/customer/resetEntitlementsV1"
import { registerSignUpV1 } from "./routes/customer/signUpV1"
import { registerStripeSetupV1 } from "./routes/paymentProvider/stripeSetupV1"
import { registerStripeSignUpV1 } from "./routes/paymentProvider/stripeSignUpV1"
import { registerGetPlanVersionV1 } from "./routes/plans/gePlanVersionV1"
import { registerGetFeaturesV1 } from "./routes/project/getFeaturesV1"

import { timing } from "hono/timing"

const app = newApp()

app.use(serveEmojiFavicon("◎"))

app.use(timing())
app.use("*", init())
app.use("*", cors())

// Handle websocket connections for Durable Objects
app.use(
  "/broadcast",
  partyserverMiddleware({
    onError: (error) => console.error(error),
    options: {
      prefix: "broadcast",
      onBeforeConnect: async (req) => {
        const token = await getToken({
          req,
          secret: env.AUTH_SECRET,
          raw: false,
          salt:
            env.NODE_ENV === "production"
              ? "__Secure-authjs.session-token"
              : "authjs.session-token",
          secureCookie: env.NODE_ENV === "production",
        })

        if (!token) return new Response("Unauthorized", { status: 401 })

        // validate exp
        if (token?.exp && token.exp < Date.now() / 1000) {
          return new Response("Unauthorized", { status: 401 })
        }

        const userId = token?.id as string | undefined

        // if id doesn't start with "usr_" throw an error
        if (!userId?.startsWith("usr_")) {
          return new Response("Unauthorized", { status: 401 })
        }
      },
    },
  })
)

// Customer routes
registerReportUsageV1(app)
registerGetEntitlementsV1(app)
registerCanV1(app)
registerResetEntitlementsV1(app)
registerGetSubscriptionV1(app)
registerGetActivePhaseV1(app)
registerGetUsageV1(app)
registerGetPaymentMethodsV1(app)
registerSignUpV1(app)
registerCreatePaymentMethodV1(app)

// Project routes
registerGetFeaturesV1(app)

// Plans routes
registerGetPlanVersionV1(app)

// Payment provider routes
registerStripeSignUpV1(app)
registerStripeSetupV1(app)

// Export handler
const handler = {
  fetch: (req: Request, env: Env, executionCtx: ExecutionContext) => {
    return app.fetch(req, env, executionCtx)
  },
} satisfies ExportedHandler<Env>

export default handler
