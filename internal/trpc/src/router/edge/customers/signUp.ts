import { TRPCError } from "@trpc/server"
import { customerSignUpSchema } from "@unprice/db/validators"
import { z } from "zod"

import { CustomerService } from "@unprice/services/customers"
import { protectedProjectProcedure } from "#trpc"

export const signUp = protectedProjectProcedure
  .input(customerSignUpSchema)
  .output(
    z.object({
      success: z.boolean(),
      url: z.string(),
      customerId: z.string(),
      error: z.string().optional(),
    })
  )
  .mutation(async (opts) => {
    const project = opts.ctx.project

    const customer = new CustomerService(opts.ctx)

    const { err, val } = await customer.signUp({
      input: opts.input,
      projectId: project.id,
    })

    if (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message,
      })
    }

    return val
  })
