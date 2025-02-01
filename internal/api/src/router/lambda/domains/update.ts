import { env } from "#/env.mjs"
import { protectedWorkspaceProcedure } from "#/trpc"
import { featureGuard } from "#/utils/feature-guard"
import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import { domains } from "@unprice/db/schema"
import { domainSelectBaseSchema, domainUpdateBaseSchema } from "@unprice/db/validators"
import { Vercel } from "@unprice/vercel"
import { z } from "zod"

export const update = protectedWorkspaceProcedure
  .input(domainUpdateBaseSchema)
  .output(z.object({ domain: domainSelectBaseSchema }))
  .mutation(async (opts) => {
    const workspace = opts.ctx.workspace
    const { id, name: domain } = opts.input
    const customerId = workspace.unPriceCustomerId
    const featureSlug = "domains"

    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    // check if the customer has access to the feature
    const result = await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      isInternal: workspace.isInternal,
      // update endpoint does not need to throw an error
      throwOnNoAccess: false,
    })

    if (result.deniedReason === "FEATURE_NOT_FOUND_IN_SUBSCRIPTION") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `You don't have access to this feature ${result.deniedReason}`,
      })
    }

    const oldDomain = await opts.ctx.db.query.domains.findFirst({
      where: (d, { eq, and }) => and(eq(d.id, id), eq(d.workspaceId, workspace.id)),
    })

    if (!oldDomain) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Domain not found",
      })
    }

    if (oldDomain.name === domain) {
      return { domain: oldDomain }
    }

    const newDomainExist = await opts.ctx.db.query.domains.findFirst({
      where: (d, { eq }) => eq(d.name, domain),
    })

    if (newDomainExist) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "New Domain already register in the system",
      })
    }

    const vercel = new Vercel({
      accessToken: env.VERCEL_TOKEN,
      teamId: env.VERCEL_TEAM_ID,
    })

    const removeData = await vercel.removeProjectDomain(
      env.VERCEL_PROJECT_UNPRICE_ID,
      oldDomain.name
    )

    if (removeData.err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: removeData.err.message,
      })
    }

    const addData = await vercel.addProjectDomain(env.VERCEL_PROJECT_UNPRICE_ID, domain)

    if (addData.err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: addData.err.message,
      })
    }

    const updateDomain = await opts.ctx.db
      .update(domains)
      .set({
        name: domain,
      })
      .where(and(eq(domains.id, id), eq(domains.workspaceId, workspace.id)))
      .returning()
      .then((res) => res[0])

    if (!updateDomain) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error updating domain",
      })
    }

    return { domain: updateDomain }
  })
