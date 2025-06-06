import { newId } from "@unprice/db/utils"
import { signUpResponseSchema, workspaceSignupSchema } from "@unprice/db/validators"

import { TRPCError } from "@trpc/server"
import { protectedProcedure } from "#trpc"
import { unprice } from "#utils/unprice"

export const signUp = protectedProcedure
  .input(workspaceSignupSchema)
  .output(signUpResponseSchema)
  .mutation(async (opts) => {
    const { name, planVersionId, config, successUrl, cancelUrl } = opts.input
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
    })

    if (error) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: error.message,
      })
    }

    return result
  })
