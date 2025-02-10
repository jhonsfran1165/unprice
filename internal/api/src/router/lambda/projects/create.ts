import { TRPCError } from "@trpc/server"
import { projects } from "@unprice/db/schema"
import { createSlug, newId } from "@unprice/db/utils"
import { projectInsertBaseSchema, projectSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedWorkspaceProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"
import { reportUsageFeature } from "#utils/shared"

export const create = protectedWorkspaceProcedure
  .input(projectInsertBaseSchema)
  .output(z.object({ project: projectSelectBaseSchema }))
  .mutation(async (opts) => {
    const { name, url, defaultCurrency, timezone } = opts.input
    const workspace = opts.ctx.workspace
    const customerId = workspace.unPriceCustomerId
    const featureSlug = "projects"

    // only owner and admin can create a project
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    // check if the customer has access to the feature
    await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      // update usage when creating a project
      updateUsage: true,
      isInternal: workspace.isInternal,
    })

    const projectId = newId("project")
    const projectSlug = createSlug()

    const newProject = await opts.ctx.db
      .insert(projects)
      .values({
        id: projectId,
        workspaceId: workspace.id,
        name,
        slug: projectSlug,
        url,
        defaultCurrency,
        timezone,
        isMain: false,
        isInternal: false,
      })
      .returning()
      .catch((err) => {
        opts.ctx.logger.error(err)

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create API key",
        })
      })
      .then((res) => res[0] ?? null)

    if (!newProject?.id) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error creating project",
      })
    }

    opts.ctx.waitUntil(
      // report usage for the new project in background
      reportUsageFeature({
        customerId,
        featureSlug,
        usage: 1, // the new project
        ctx: opts.ctx,
        isInternal: workspace.isInternal,
      })
    )

    return {
      project: newProject,
    }
  })
