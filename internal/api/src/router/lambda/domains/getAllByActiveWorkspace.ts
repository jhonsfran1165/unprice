import { domainSelectBaseSchema, featureVerificationSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedWorkspaceProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"

export const getAllByActiveWorkspace = protectedWorkspaceProcedure
  .input(z.void())
  .output(
    z.object({
      domains: z.array(domainSelectBaseSchema),
      error: featureVerificationSchema,
    })
  )
  .query(async (opts) => {
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
      metadata: {
        action: "getAllByActiveWorkspace",
      },
    })

    if (!result.access) {
      return {
        domains: [],
        error: {
          access: result.access,
          deniedReason: result.deniedReason,
        },
      }
    }

    const domains = await opts.ctx.db.query.domains.findMany({
      where: (d, { eq }) => eq(d.workspaceId, workspace.id),
    })

    return {
      domains,
      error: result,
    }
  })
