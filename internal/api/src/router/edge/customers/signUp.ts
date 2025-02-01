import { CustomerService } from "#/services/customers"
import { protectedApiOrActiveProjectProcedure } from "#/trpc"
import { TRPCError } from "@trpc/server"
import { customerSignUpSchema } from "@unprice/db/validators"
import { z } from "zod"

export const signUp = protectedApiOrActiveProjectProcedure
  .meta({
    span: "customers.signUp",
    openapi: {
      method: "POST",
      path: "/edge/customers.signUp",
      protect: true,
    },
  })
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
