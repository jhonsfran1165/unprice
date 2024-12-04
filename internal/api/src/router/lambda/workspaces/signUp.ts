import { TRPCError } from "@trpc/server"
import { type Database, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"
import { workspaceSignupSchema } from "@unprice/db/validators"
import { CustomerService } from "@unprice/services/customers"
import { z } from "zod"
import { protectedProcedure } from "../../../trpc"

export const signUp = protectedProcedure
  .input(workspaceSignupSchema)
  .output(
    z.object({
      url: z.string(),
    })
  )
  .mutation(async (opts) => {
    const { name, planVersionId, config, successUrl, cancelUrl } = opts.input
    const user = opts.ctx.session?.user
    const workspaceId = newId("workspace")

    const mainProject = await opts.ctx.db.query.projects.findFirst({
      where: eq(schema.projects.isMain, true),
    })

    if (!mainProject) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Main project not found",
      })
    }

    const customer = new CustomerService({
      cache: opts.ctx.cache,
      db: opts.ctx.db as Database,
      analytics: opts.ctx.analytics,
      logger: opts.ctx.logger,
      metrics: opts.ctx.metrics,
      waitUntil: opts.ctx.waitUntil,
    })

    const { err, val } = await customer.signUp({
      input: {
        email: user.email,
        name: name,
        planVersionId,
        config,
        successUrl,
        cancelUrl,
        externalId: workspaceId,
        timezone: mainProject.timezone,
        defaultCurrency: mainProject.defaultCurrency,
      },
      projectId: mainProject.id,
    })

    if (err) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: err.message,
      })
    }

    return val
  })
