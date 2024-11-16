import { TRPCError } from "@trpc/server"
import type { Database } from "@unprice/db"
import { customerSignUpSchema } from "@unprice/db/validators"
import { CustomerService } from "@unprice/services/customers"
import { z } from "zod"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"

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

    const customer = new CustomerService({
      cache: opts.ctx.cache,
      db: opts.ctx.db as Database,
      analytics: opts.ctx.analytics,
      logger: opts.ctx.logger,
      metrics: opts.ctx.metrics,
      waitUntil: opts.ctx.waitUntil,
    })

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
