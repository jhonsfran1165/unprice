import { TRPCError } from "@trpc/server"
import { eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { projectSelectBaseSchema, transferToPersonalProjectSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedWorkspaceProcedure } from "../../../trpc"
import { projectWorkspaceGuard } from "../../../utils"
import { featureGuard } from "../../../utils/feature-guard"

export const transferToPersonal = protectedWorkspaceProcedure
  .input(transferToPersonalProjectSchema)
  .output(
    z.object({
      project: projectSelectBaseSchema.optional(),
      workspaceSlug: z.string().optional(),
    })
  )
  .mutation(async (opts) => {
    const { slug: projectSlug } = opts.input
    const userId = opts.ctx.userId
    const workspace = opts.ctx.workspace
    const customerId = workspace.unPriceCustomerId
    const featureSlug = "projects"

    // only owner can transfer a project to personal
    opts.ctx.verifyRole(["OWNER"])

    // check if the customer has access to the feature
    await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      noCache: true,
      updateUsage: true,
      includeCustom: true,
      isInternal: workspace.isInternal,
    })

    // get the project data
    const { project: projectData } = await projectWorkspaceGuard({
      projectSlug,
      ctx: opts.ctx,
    })

    if (projectData.workspace.isPersonal) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Project is already in the personal workspace",
      })
    }

    if (projectData.isMain) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot transfer main project",
      })
    }

    const personalTargetWorkspace = await opts.ctx.db.query.workspaces.findFirst({
      columns: {
        id: true,
        slug: true,
      },
      where: (workspace, { eq, and }) =>
        and(eq(workspace.createdBy, userId), eq(workspace.isPersonal, true)),
    })

    if (!personalTargetWorkspace?.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "There is no personal workspace for the user",
      })
    }

    // change the workspace for the project to personalTargetWorkspace
    const updatedProject = await opts.ctx.db
      .update(schema.projects)
      .set({
        workspaceId: personalTargetWorkspace.id,
      })
      .where(eq(schema.projects.id, projectData.id))
      .returning()
      .then((res) => res[0] ?? undefined)

    return {
      project: updatedProject,
      workspaceSlug: personalTargetWorkspace.slug,
    }
  })
