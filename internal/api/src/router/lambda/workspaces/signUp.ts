import { TRPCError } from "@trpc/server"
import { eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"
import { workspaceSignupSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProcedure } from "../../../trpc"
import { signUpCustomer } from "../../../utils/shared"

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

    const { success, error, url } = await signUpCustomer({
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
      ctx: opts.ctx,
      projectId: mainProject.id,
    })

    if (!success) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: error ?? "Failed to sign up customer",
      })
    }

    return { url }
  })
