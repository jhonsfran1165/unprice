import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import { domains } from "@unprice/db/schema"
import {
  type DomainVerificationStatusProps,
  domainVerificationStatusSchema,
} from "@unprice/db/validators"
import type { Domain } from "@unprice/vercel"
import { Vercel } from "@unprice/vercel"
import { z } from "zod"
import { env } from "#env"
import { protectedWorkspaceProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"

export const verify = protectedWorkspaceProcedure
  .input(z.object({ domain: z.string() }))
  .output(
    z.object({
      status: domainVerificationStatusSchema,
      domainProvider: z.custom<Domain>().optional(),
    })
  )
  .query(async (opts) => {
    let status: DomainVerificationStatusProps = "Valid Configuration"
    const workspace = opts.ctx.workspace
    const customerId = workspace.unPriceCustomerId
    const featureSlug = "domains"

    // check if the customer has access to the feature
    const result = await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      isInternal: workspace.isInternal,
    })

    if (!result.access) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `You don't have access to this feature ${result.deniedReason}`,
      })
    }

    const vercel = new Vercel({
      accessToken: env.VERCEL_TOKEN,
      teamId: env.VERCEL_TEAM_ID,
    })

    const [domainVercel, configDomain] = await Promise.all([
      vercel.getProjectDomain(env.VERCEL_PROJECT_UNPRICE_ID, opts.input.domain),
      vercel.getDomainConfig(opts.input.domain),
    ])

    if (domainVercel?.err?.code === "not_found") {
      status = "Domain Not Found"
    } else if (domainVercel?.err) {
      status = "Unknown Error"
    } else if (!domainVercel?.val.verified) {
      status = "Pending Verification"

      const domainVerification = await vercel.verifyProjectDomain(
        env.VERCEL_PROJECT_UNPRICE_ID,
        opts.input.domain
      )

      if (domainVerification.val?.verified) {
        status = "Valid Configuration"
      } else {
        status = "Pending Verification"
      }
    } else if (configDomain.val?.misconfigured) {
      status = "Invalid Configuration"
    }

    await opts.ctx.db
      .update(domains)
      .set({
        verified: status === "Valid Configuration",
      })
      .where(
        and(eq(domains.name, opts.input.domain), eq(domains.workspaceId, opts.ctx.workspace.id))
      )

    return {
      status,
      domainProvider: domainVercel.val,
    }
  })
