import { TRPCError } from "@trpc/server"
import { domains } from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"
import { domainCreateBaseSchema, domainSelectBaseSchema } from "@unprice/db/validators"
import { Vercel } from "@unprice/vercel"
import { z } from "zod"
import { env } from "../../../env.mjs"
import { protectedWorkspaceProcedure } from "../../../trpc"
import { featureGuard } from "../../../utils/feature-guard"
import { reportUsageFeature } from "../../../utils/shared"

export const create = protectedWorkspaceProcedure
  .input(domainCreateBaseSchema.pick({ name: true }))
  .output(z.object({ domain: domainSelectBaseSchema }))
  .mutation(async (opts) => {
    const workspace = opts.ctx.workspace
    const domain = opts.input.name
    const customerId = workspace.unPriceCustomerId
    const featureSlug = "domains"

    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    // check if the customer has access to the feature
    await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      updateUsage: true,
      isInternal: workspace.isInternal,
    })

    const domainExist = await opts.ctx.db.query.domains.findFirst({
      where: (d, { eq }) => eq(d.name, domain),
    })

    if (domainExist) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Domain already exists",
      })
    }

    const vercel = new Vercel({
      accessToken: env.VERCEL_TOKEN,
      teamId: env.VERCEL_TEAM_ID,
    })

    const response = await vercel.addProjectDomain(env.VERCEL_PROJECT_UNPRICE_ID, domain)

    if (response.err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: response.err.message,
      })
    }

    const domainVercel = response.val

    if (!domainVercel.apexName || !domainVercel.name) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error adding domain to domain provider",
      })
    }

    const domainId = newId("domain")

    const domainData = await opts.ctx.db
      .insert(domains)
      .values({
        id: domainId,
        name: domainVercel.name,
        apexName: domainVercel.apexName,
        workspaceId: workspace.id,
      })
      .returning()
      .then((res) => res[0])

    if (!domainData) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error adding domain",
      })
    }

    opts.ctx.waitUntil(
      // report usage for the new domain in background
      reportUsageFeature({
        customerId,
        featureSlug,
        usage: 1, // the new domain
        ctx: opts.ctx,
        isInternal: workspace.isInternal,
      })
    )

    return { domain: domainData }
  })
