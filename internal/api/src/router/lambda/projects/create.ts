import { TRPCError } from "@trpc/server"
import { eq, sql } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import * as utils from "@unprice/db/utils"
import { projectInsertBaseSchema, projectSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedWorkspaceProcedure } from "../../../trpc"

// TODO: Don't hardcode the limit to PRO
const PROJECT_LIMITS = {
  FREE: 1,
  PRO: 3,
} as const

export const create = protectedWorkspaceProcedure
  .input(projectInsertBaseSchema)
  .output(z.object({ project: projectSelectBaseSchema }))
  .mutation(async (opts) => {
    const { name, url, defaultCurrency, timezone } = opts.input
    const workspace = opts.ctx.workspace

    // only owner and admin can create a project
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const countProjectsWorkspace = await opts.ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.projects)
      .where(eq(schema.projects.workspaceId, workspace.id))
      .then((res) => res[0]?.count ?? 0)

    // TODO: Don't hardcode the limit to PRO
    // TODO: use unprice verification here
    if (countProjectsWorkspace >= PROJECT_LIMITS.PRO) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Limit of projects reached" })
    }

    // TODO: should be able to retry if the slug already exists
    const projectId = utils.newId("project")
    const projectSlug = utils.createSlug()

    const newProject = await opts.ctx.db
      .insert(schema.projects)
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
      .then((res) => res[0] ?? null)

    if (!newProject?.id) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error creating project",
      })
    }

    return {
      project: newProject,
    }
  })
