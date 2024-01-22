import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq } from "@builderai/db"
import {
  createFeatureSchema,
  feature,
  updateFeatureSchema,
} from "@builderai/db/schema/price"
import { newIdEdge } from "@builderai/db/utils"

import { createTRPCRouter, protectedOrgProcedure } from "../../trpc"
import { hasAccessToProject } from "../../utils"

export const featureRouter = createTRPCRouter({
  create: protectedOrgProcedure
    .input(createFeatureSchema)
    .mutation(async (opts) => {
      const { projectSlug, slug, title } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const featureId = newIdEdge("feature")

      const featureDate = await opts.ctx.db
        .insert(feature)
        .values({
          id: featureId,
          slug,
          title,
          projectId: project.id,
          tenantId: opts.ctx.tenantId,
        })
        .returning()

      return featureDate[0]
    }),
  update: protectedOrgProcedure
    .input(updateFeatureSchema)
    .mutation(async (opts) => {
      const { title, id } = opts.input

      const featureData = await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS.query.feature.findFirst({
          with: {
            project: {
              columns: {
                slug: true,
              },
            },
          },
          where: (feature, { eq }) => eq(feature.id, id),
        })
      })

      if (!featureData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feature not found",
        })
      }

      const { project } = await hasAccessToProject({
        projectSlug: featureData.project.slug,
        ctx: opts.ctx,
      })

      return await opts.ctx.db
        .update(feature)
        .set({
          title,
        })
        .where(and(eq(feature.id, id), eq(feature.projectId, project.id)))
        .returning()
    }),

  getById: protectedOrgProcedure
    .input(z.object({ id: z.string() }))
    .query(async (opts) => {
      const { id } = opts.input

      return await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS.query.feature.findFirst({
          with: {
            project: {
              columns: {
                slug: true,
              },
            },
          },
          where: (feature, { eq }) => eq(feature.id, id),
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

      const feature = await opts.ctx.txRLS(({ txRLS }) =>
        txRLS.query.feature.findMany({
          where: (feature, { eq }) => eq(feature.projectId, project.id),
        })
      )

      return {
        feature,
      }
    }),
})
