import { newId } from "@unprice/db/utils"
import { signUpResponseSchema, workspaceSignupSchema } from "@unprice/db/validators"

import { TRPCError } from "@trpc/server"
import { WelcomeEmail, sendEmail } from "@unprice/email"
import { protectedProcedure } from "#trpc"
import { unprice } from "#utils/unprice"

export const signUp = protectedProcedure
  .input(workspaceSignupSchema)
  .output(signUpResponseSchema)
  .mutation(async (opts) => {
    const { name, planVersionId, config, successUrl, cancelUrl, sessionId } = opts.input
    const user = opts.ctx.session?.user
    const workspaceId = newId("workspace")

    // sign up the customer
    const { error, result } = await unprice.customers.signUp({
      email: user.email,
      name: name,
      planVersionId,
      config,
      successUrl,
      cancelUrl,
      externalId: workspaceId,
      sessionId,
    })

    if (error) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: error.message,
      })
    }

    opts.ctx.waitUntil(
      sendEmail({
        subject: "Welcome to Unprice 👋",
        to: [user.email],
        react: WelcomeEmail({ firstName: user.name ?? user.email }),
      })
    )

    return result
  })
