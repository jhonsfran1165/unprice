import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq } from "@builderai/db"
import {
  canva,
  createCanvaSchema,
  updateCanvaSchema,
} from "@builderai/db/schema/canva"
import { newIdEdge } from "@builderai/db/utils"

import {
  createTRPCRouter,
  protectedOrgProcedure,
  publicProcedure,
} from "../../trpc"
import { hasAccessToProject } from "../../utils"

export const canvaRouter = createTRPCRouter({
  create: protectedOrgProcedure
    .input(createCanvaSchema)
    .mutation(async (opts) => {
      const { projectSlug, content, slug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const canvaId = newIdEdge("canva")

      const canvaData = await opts.ctx.db
        .insert(canva)
        .values({
          id: canvaId,
          slug,
          content,
          projectId: project.id,
          tenantId: opts.ctx.tenantId,
        })
        .returning()

      return canvaData[0]
    }),
  update: protectedOrgProcedure
    .input(updateCanvaSchema)
    .mutation(async (opts) => {
      const { content, id } = opts.input

      const canvaData = await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS.query.canva.findFirst({
          with: {
            project: {
              columns: {
                slug: true,
              },
            },
          },
          where: (canva, { eq }) => eq(canva.id, id),
        })
      })

      if (!canvaData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Canva not found",
        })
      }

      const { project } = await hasAccessToProject({
        projectSlug: canvaData.project.slug,
        ctx: opts.ctx,
      })

      return await opts.ctx.db
        .update(canva)
        .set({
          content,
        })
        .where(and(eq(canva.id, id), eq(canva.projectId, project.id)))
        .returning()
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async (opts) => {
      const { id } = opts.input

      return await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS.query.canva.findFirst({
          with: {
            project: {
              columns: {
                slug: true,
              },
            },
          },
          where: (canva, { eq }) => eq(canva.id, id),
        })
      })
    }),

  listByProject: protectedOrgProcedure
    .input(z.object({ projectSlug: z.string() }))
    .query(async (opts) => {
      const { projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const canvas = await opts.ctx.txRLS(({ txRLS }) =>
        txRLS.query.canva.findMany({
          where: (canva, { eq }) => eq(canva.projectId, project.id),
        })
      )

      // FIXME: Don't hardcode the limit to PRO
      return {
        canvas,
        limit: 3,
        limitReached: false,
      }
    }),
})
