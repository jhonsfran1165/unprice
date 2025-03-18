import { env } from "cloudflare:workers"
import { getToken } from "@auth/core/jwt"
import { ConsoleLogger } from "@unprice/logging"
import { partyserverMiddleware } from "hono-party"
import { cors } from "hono/cors"
import { type Env, zEnv } from "~/env"
import { newApp } from "~/hono/app"
import { init } from "~/middleware/init"

export { DurableObjectUsagelimiter } from "~/usagelimit/do"

import { registerTest } from "~/routes/test"

const app = newApp()

app.use("*", init())
app.use("*", cors())

// Handle websocket connections for Durable Objects
app.use(
  "*",
  partyserverMiddleware({
    onError: (error) => console.error(error),
    options: {
      prefix: "broadcast",
      onBeforeConnect: async (_req) => {
        // this should be defined once frontend calls the api from nextjs
        const mockReq = new Request("https://example.com", {
          headers: {
            cookie:
              "authjs.callback-url=http%3A%2F%2Fapp.localhost%3A3000; workspace-slug=unprice-admin; authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiNFYzN1ZYZ1lPd2FzblhTX05vUjIzTExySlZPN3djN19ocjBOV01CbEFtQ0ZrUFFCVFNtNjU4eDQtQWZ2OEx5R1psampfemZfbHR2S2E1ZTJQb1hhZlEifQ..slbIvroUNwKCNaZzHnbbfg.QQo6qK_LWRw-CSh0zNABEcuhcNkqjUUkY-1xdCXYB3ZjjGG4C_eKX02ocESpRYA8hL_bBHHnbXb_VpKlQjFall3IPR-_GjUKfy9PSMpPEe10IMGEcL16EOd0Q8c1gv-8G1aIfO7YTjixPjYsmb62zcEbCPlqcVweSWQnC6bBpCfSc5WTJ7KDNp_w_o2BVBX4EBL6l89aTU0jiDs43Nbn9YUoAsmSoZrDu-AEkP_CrVbG2MKKS0rJXOfVyCnEl_R3_PYXkyPy-pnOldozjSbP7xALVnxqq0me7slMwGjn8J28ol0Ulax2wwH6X0cqSnqNheT0QThxl1-mF3tEv42DwF1rlFWwkHpQNvN8sX7DYSzE4GEMG7bOkBvjsYW5eGF_vg8DmYpR1SJoy2kR3Nkx9Jkp2hwYDTNK6cbRZTMgSfTkNSsL4ZReSJNo5Tekw7oo3T02FPqzFulBSOq5tzCwN5qJUtpXDkf1cE71fEnT10QesYYW3QJjpAyyUdFjez6PON8kXlVXdmhr2otrLsvQL55QxAi9-P8AIp1l3Zqj5f8sFG9_cLaywHe6YzA2l9yiiY4gTURft9qQxww_vV7Xt9zGANmGOBMFH-od_AuMVvVnpB2ekn4sojs8UhBRte7LziAiV37nuDSjOra4v4-_AnIoIPcUfG0PpvxKbwJVEN0.M6HImOZll2I7pSE-p4Kty0VTAZkRuv8PA-gC-TP956I",
          },
        })

        const token = await getToken({
          req: mockReq,
          secret: env.AUTH_SECRET,
          raw: false,
          salt: env.ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token",
          // TODO: find a way to get this from the env
          // secureCookie: env.ENV === "production",
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
