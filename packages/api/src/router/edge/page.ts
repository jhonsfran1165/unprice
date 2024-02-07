import { z } from "zod"

import { and, eq, schema, utils } from "@builderai/db"
import { createPageSchema, updatePageSchema } from "@builderai/validators/page"

import {
  createTRPCRouter,
  protectedOrgProcedure,
  publicProcedure,
} from "../../trpc"
import { hasAccessToProject } from "../../utils"

export const pageRouter = createTRPCRouter({
  create: protectedOrgProcedure
    .input(createPageSchema)
    .mutation(async (opts) => {
      const { projectSlug, html, id, version } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const pageId = id?.replace(/^shape:/, "") ?? utils.newIdEdge("page")
      const pageSlug = utils.generateSlug(2)

      return await opts.ctx.db
        .insert(schema.page)
        .values({
          id: pageId,
          slug: pageSlug,
          html,
          version,
          projectId: project.id,
          tenantId: opts.ctx.tenantId,
        })
        .returning()
    }),
  update: protectedOrgProcedure
    .input(updatePageSchema)
    .mutation(async (opts) => {
      const { projectSlug, html, id, version } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      return await opts.ctx.db
        .update(schema.page)
        .set({
          html,
          version,
        })
        .where(
          and(eq(schema.page.id, id), eq(schema.page.projectId, project.id))
        )
        .returning()
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string(), version: z.number() }))
    .query(async (opts) => {
      const { id, version } = opts.input

      const page = await opts.ctx.db.query.page.findFirst({
        where: (page, { eq, and }) =>
          and(eq(page.id, id), eq(page.version, version)),
      })

      return page
    }),
})
