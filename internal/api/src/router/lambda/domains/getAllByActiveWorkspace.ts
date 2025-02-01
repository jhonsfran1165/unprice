import { protectedWorkspaceProcedure } from "#/trpc"
import { featureGuard } from "#/utils/feature-guard"
import { TRPCError } from "@trpc/server"
import { domainSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"

export const getAllByActiveWorkspace = protectedWorkspaceProcedure
  .input(z.void())
  .output(z.array(domainSelectBaseSchema))
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
      // list endpoint does not need to throw an error
      throwOnNoAccess: false,
    })

    if (result.deniedReason === "FEATURE_NOT_FOUND_IN_SUBSCRIPTION") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `You don't have access to this feature ${result.deniedReason}`,
      })
    }

    const domains = await opts.ctx.db.query.domains.findMany({
      where: (d, { eq }) => eq(d.workspaceId, workspace.id),
    })

    return domains
  })
