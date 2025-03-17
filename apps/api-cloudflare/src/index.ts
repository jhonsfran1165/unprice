import { ConsoleLogger } from "@unprice/logging"
import { partyserverMiddleware } from "hono-party"
import { type Env, zEnv } from "~/env"
import { newApp } from "~/hono/app"
import { init } from "~/middleware/init"

export { DurableObjectUsagelimiter } from "~/usagelimit/do"

import { registerTest } from "~/routes/test"

const app = newApp()

app.use("*", init())

// Handle websocket connections for Durable Objects
app.use(
  "*",
  partyserverMiddleware({
    onError: (error) => console.error(error),
    options: {
      prefix: "broadcast",
      onBeforeConnect: async (_req) => {
        // const token = req.headers.get("authorization")
        // validate token
        // if (!token) return new Response("Unauthorized", { status: 401 })
      },
    },
  })
)

// Register routes
registerTest(app)

// Export handler
const handler = {
  fetch: (req: Request, env: Env, executionCtx: ExecutionContext) => {
    const parsedEnv = zEnv.safeParse(env)
    if (!parsedEnv.success) {
      new ConsoleLogger({
        requestId: "",
        environment: env.ENV,
        application: "api",
      }).fatal(`BAD_ENVIRONMENT: ${parsedEnv.error.message}`)
      return Response.json(
        {
          code: "BAD_ENVIRONMENT",
          message: "Some environment variables are missing or are invalid",
          errors: parsedEnv.error,
        },
        { status: 500 }
      )
    }

    return app.fetch(req, parsedEnv.data, executionCtx)
  },
} satisfies ExportedHandler<Env>

export default handler
