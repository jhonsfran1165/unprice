import { z } from "zod"

import { protectedProjectProcedure } from "#trpc"
import { signOutCustomer } from "#utils/shared"

export const signOut = protectedProjectProcedure
  .input(z.object({ customerId: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .mutation(async (opts) => {
    const project = opts.ctx.project

    return await signOutCustomer({
      input: {
        customerId: opts.input.customerId,
        projectId: project.id,
      },
      ctx: opts.ctx,
    })
  })
