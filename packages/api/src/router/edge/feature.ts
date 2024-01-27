import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq } from "@builderai/db"
import {
  createFeatureSchema,
  feature,
  featureBase,
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

      return featureBase.parse(featureDate[0])
    }),
  update: protectedOrgProcedure
    .input(updateFeatureSchema)
    .mutation(async (opts) => {
      const { title, id, description, type } = opts.input

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

      const data = await opts.ctx.db
        .update(feature)
        .set({
          title,
          description,
          type,
        })
        .where(and(eq(feature.id, id), eq(feature.projectId, project.id)))
        .returning()

      return featureBase.parse(data[0])
    }),
  featureExist: protectedOrgProcedure
    .input(z.object({ slug: z.string(), projectSlug: z.string() }))
    .mutation(async (opts) => {
      const { slug, projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const feature = await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS.query.feature.findFirst({
          with: {
            project: {
              columns: {
                slug: true,
              },
            },
          },
          where: (feature, { eq, and }) =>
            and(eq(feature.projectId, project.id), eq(feature.slug, slug)),
        })
      })

      return {
        feature,
      }
    }),
  getBySlug: protectedOrgProcedure
    .input(z.object({ slug: z.string(), projectSlug: z.string() }))
    .query(async (opts) => {
      const { slug, projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const feature = await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS.query.feature.findFirst({
          with: {
            project: {
              columns: {
                slug: true,
              },
            },
          },
          where: (feature, { eq, and }) =>
            and(eq(feature.projectId, project.id), eq(feature.slug, slug)),
        })
      })

      return {
        feature: featureBase.parse(feature),
      }
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

  searchBy: protectedOrgProcedure
    .input(
      z.object({
        projectSlug: z.string(),
        search: z.string().optional(),
      })
    )
    .query(async (opts) => {
      const { projectSlug, search } = opts.input
      const filter = `%${search}%`

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const features = await opts.ctx.txRLS(({ txRLS }) =>
        txRLS.query.feature.findMany({
          where: (feature, { eq, and, or, ilike }) =>
            and(
              eq(feature.projectId, project.id),
              or(ilike(feature.slug, filter), ilike(feature.title, filter))
            ),
        })
      )

      // TODO: avoid selecting all columns
      return {
        feature: features.map((feature) => featureBase.parse(feature)),
      }
    }),

  listByProject: protectedOrgProcedure
    .input(z.object({ projectSlug: z.string() }))
    .query(async (opts) => {
      const { projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const features = await opts.ctx.txRLS(({ txRLS }) =>
        txRLS.query.feature.findMany({
          where: (feature, { eq }) => eq(feature.projectId, project.id),
        })
      )

      return {
        feature: features.map((feature) => featureBase.parse(feature)),
      }
    }),
})
