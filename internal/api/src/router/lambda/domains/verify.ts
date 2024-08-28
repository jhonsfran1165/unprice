import { and, eq } from "@unprice/db"
import { domains } from "@unprice/db/schema"
import {
  type DomainVerificationStatusProps,
  domainVerificationStatusSchema,
} from "@unprice/db/validators"
import { Vercel } from "@unprice/vercel"
import type { Domain } from "@unprice/vercel"
import { z } from "zod"
import { env } from "../../../env.mjs"
import { protectedWorkspaceProcedure } from "../../../trpc"

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

    const vercel = new Vercel({
      accessToken: env.VERCEL_AUTH_BEARER_TOKEN,
      teamId: env.TEAM_ID_VERCEL,
    })

    const [domainVercel, configDomain] = await Promise.all([
      vercel.getProjectDomain(env.PROJECT_ID_VERCEL, opts.input.domain),
      vercel.getDomainConfig(opts.input.domain),
    ])

    if (domainVercel?.err?.code === "not_found") {
      status = "Domain Not Found"
    } else if (domainVercel?.err) {
      status = "Unknown Error"
    } else if (!domainVercel?.val.verified) {
      status = "Pending Verification"

      const domainVerification = await vercel.verifyProjectDomain(
        env.PROJECT_ID_VERCEL,
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
