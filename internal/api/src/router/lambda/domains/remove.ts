import { TRPCError } from "@trpc/server"
import { eq } from "@unprice/db"
import { domains } from "@unprice/db/schema"
import { domainSelectBaseSchema } from "@unprice/db/validators"
import { Vercel } from "@unprice/vercel"
import { z } from "zod"
import { env } from "../../../env.mjs"
import { protectedWorkspaceProcedure } from "../../../trpc"

export const remove = protectedWorkspaceProcedure
  .input(z.object({ id: z.string() }))
  .output(
    z.object({
      domain: domainSelectBaseSchema.optional(),
    })
  )
  .mutation(async (opts) => {
    const workspace = opts.ctx.workspace

    // only owner and admin can remove a domain
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const domain = await opts.ctx.db.query.domains.findFirst({
      where: (d, { eq, and }) => and(eq(d.id, opts.input.id), eq(d.workspaceId, workspace.id)),
    })

    if (!domain) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Domain not found",
      })
    }

    // TODO: I also need to remove the domain from the vercel account
    // not that easy as delete it and we are done, but maybe that domain is used for another account
    // maybe with a cron job that verify if the domain is used by another account and then remove it from our account
    // for now, I will just remove it from the project
    const vercel = new Vercel({
      accessToken: env.VERCEL_TOKEN,
      teamId: env.VERCEL_TEAM_ID,
    })

    // remove the old domain from vercel
    const removeData = await vercel.removeProjectDomain(env.PROJECT_ID_VERCEL, domain.name)

    if (removeData.err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: removeData.err.message,
      })
    }

    const deletedDomain = await opts.ctx.db
      .delete(domains)
      .where(eq(domains.id, domain.id))
      .returning()
      .then((res) => res[0])

    return {
      domain: deletedDomain,
    }
  })
