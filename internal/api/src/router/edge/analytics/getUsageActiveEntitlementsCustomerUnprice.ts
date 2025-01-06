import { TRPCError } from "@trpc/server"
import { eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { customerEntitlementSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"
import { getEntitlements } from "../../../utils/shared"

export const getUsageActiveEntitlementsCustomerUnprice = protectedProjectProcedure
  .input(
    z.object({
      customerId: z.string(),
    })
  )
  .output(
    z.object({
      entitlements: customerEntitlementSchema
        .omit({
          createdAtM: true,
          updatedAtM: true,
        })
        .array(),
    })
  )
  .query(async (opts) => {
    const { customerId } = opts.input

    const mainProject = await opts.ctx.db.query.projects.findFirst({
      where: eq(schema.projects.isMain, true),
    })

    if (!mainProject) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Main project not found",
      })
    }

    const entitlements = await getEntitlements({
      customerId,
      projectId: mainProject.id,
      ctx: opts.ctx,
      noCache: true,
    })

    return {
      entitlements,
    }
  })
