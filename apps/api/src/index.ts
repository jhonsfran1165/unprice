import { partyserverMiddleware } from 'hono-party'
import type { Env } from './env'
import { newApp } from './hono/app'
import { init } from './middleware/init'

export { DurableObjectUsagelimiter } from './usagelimit/do'

const app = newApp()

app.use('*', init())

// With custom routing
app.use(
  '*',
  partyserverMiddleware({
    options: {
    },
  }),
)

const handler = {
  fetch: (req: Request, env: Env, executionCtx: ExecutionContext) => {
    const parsedEnv = zEnv.safeParse(env);
    if (!parsedEnv.success) {
      new ConsoleLogger({
        requestId: "",
        environment: env.ENVIRONMENT,
        application: "api",
      }).fatal(`BAD_ENVIRONMENT: ${parsedEnv.error.message}`);
      return Response.json(
        {
          code: "BAD_ENVIRONMENT",
          message: "Some environment variables are missing or are invalid",
          errors: parsedEnv.error,
        },
        { status: 500 },
      );
    }

    return app.fetch(req, parsedEnv.data, executionCtx);
  },

} satisfies ExportedHandler<Env, MessageBody>;

export default handler;
