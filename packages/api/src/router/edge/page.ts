import { z } from "zod"

import { and, eq } from "@builderai/db"
import {
  createPageSchema,
  page,
  updatePageSchema,
} from "@builderai/db/schema/page"
import { generateSlug, newIdEdge } from "@builderai/db/utils"

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
      const { projectSlug, html, id } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const pageId = id?.replace(/^shape:/, "") ?? newIdEdge("page")
      const pageSlug = generateSlug(2)

      return await opts.ctx.db
        .insert(page)
        .values({
          id: pageId,
          slug: pageSlug,
          html,
          projectId: project.id,
          tenantId: opts.ctx.tenantId,
        })
        .returning()
    }),
  update: protectedOrgProcedure
    .input(updatePageSchema)
    .mutation(async (opts) => {
      const { projectSlug, html, id } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      return await opts.ctx.db
        .update(page)
        .set({
          html,
        })
        .where(and(eq(page.id, id), eq(page.projectId, project.id)))
        .returning()
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async (opts) => {
      const { id } = opts.input

      const page = await opts.ctx.db.query.page.findFirst({
        where: (page, { eq }) => eq(page.id, id),
      })

      return page
    }),
})
