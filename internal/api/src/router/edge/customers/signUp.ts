import { customerSignUpSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"
import { signUpCustomer } from "../../../utils/shared"

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

    return await signUpCustomer({
      input: opts.input,
      ctx: opts.ctx,
      projectId: project.id,
    })
  })
