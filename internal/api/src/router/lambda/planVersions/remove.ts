import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { planVersionSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

export const remove = protectedProjectProcedure
  .input(
    planVersionSelectBaseSchema
      .pick({
        id: true,
      })
      .required({ id: true })
  )
  .output(z.object({ planVersion: planVersionSelectBaseSchema }))
  .mutation(async (opts) => {
    const { id } = opts.input
    const project = opts.ctx.project

    // only owner and admin can delete a plan version
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const planVersionData = await opts.ctx.db.query.versions.findFirst({
      where: (version, { and, eq }) => and(eq(version.id, id), eq(version.projectId, project.id)),
    })

    if (!planVersionData?.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "version not found",
      })
    }

    // TODO: should we allow to delete a published version when there is no subscription?
    if (planVersionData?.status === "published") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Cannot delete a published version, deactivate it instead",
      })
    }

    const deletedPlanVersion = await opts.ctx.db
      .delete(schema.versions)
      .where(
        and(eq(schema.versions.projectId, project.id), eq(schema.versions.id, planVersionData.id))
      )
      .returning()
      .then((data) => data[0])

    if (!deletedPlanVersion?.id) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error deleting version",
      })
    }

    return {
      planVersion: deletedPlanVersion,
    }
  })
