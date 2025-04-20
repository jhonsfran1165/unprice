import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import { domains } from "@unprice/db/schema"
import { domainSelectBaseSchema, domainUpdateBaseSchema } from "@unprice/db/validators"
import { Vercel } from "@unprice/vercel"
import { z } from "zod"
import { env } from "#env"
import { protectedWorkspaceProcedure } from "#trpc"

export const update = protectedWorkspaceProcedure
  .input(domainUpdateBaseSchema)
  .output(z.object({ domain: domainSelectBaseSchema }))
  .mutation(async (opts) => {
    const workspace = opts.ctx.workspace
    const { id, name: domain } = opts.input

    opts.ctx.verifyRole(["OWNER", "ADMIN"])

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
