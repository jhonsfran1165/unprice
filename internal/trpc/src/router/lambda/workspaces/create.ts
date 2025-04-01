import { TRPCError } from "@trpc/server"
import { and, eq, sql } from "@unprice/db"
import { members } from "@unprice/db/schema"
import { workspaceInsertBase, workspaceSelectBase } from "@unprice/db/validators"
import { z } from "zod"

import { protectedProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"
import { createWorkspace } from "#utils/shared"

export const create = protectedProcedure
  .input(
    workspaceInsertBase.required({
      name: true,
      unPriceCustomerId: true,
    })
  )
  .output(
    z.object({
      workspace: workspaceSelectBase,
    })
  )
  .mutation(async (opts) => {
    const userId = opts.ctx.userId
    const featureSlug = "access-pro"

    let isPersonal = true

    // verify if the user is a member of any workspace
    const countMembers = await opts.ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(and(eq(members.userId, userId)))
      .then((res) => res[0]?.count ?? 0)

    // if the user is a member of any workspace, the workspace is not personal
    if (countMembers > 0) {
      isPersonal = false
    }

    // check if the customer has access to the feature when is not a personal workspace
    if (!isPersonal) {
      // check if the customer has access to the feature
      const result = await featureGuard({
        customerId: opts.input.unPriceCustomerId,
        featureSlug,
        ctx: opts.ctx,
        skipCache: true,
        updateUsage: true,
        includeCustom: true,
        isInternal: false,
        metadata: {
          action: "create",
        },
      })

      if (!result.access) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `You don't have access to this feature ${result.deniedReason}`,
        })
      }
    }

    const newWorkspace = await createWorkspace({
      input: {
        ...opts.input,
        isPersonal,
      },
      ctx: opts.ctx,
    })

    if (!newWorkspace) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Workspace not created",
      })
    }

    return {
      workspace: newWorkspace,
    }
  })
