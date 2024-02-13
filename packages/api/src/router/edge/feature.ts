import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq, schema, utils } from "@builderai/db"
import {
  createFeatureSchema,
  deleteFeatureSchema,
  featureSelectBaseSchema,
  updateFeatureSchema,
} from "@builderai/validators/price"

import { createTRPCRouter, protectedOrgProcedure } from "../../trpc"
import { hasAccessToProject } from "../../utils"

export const featureRouter = createTRPCRouter({
  create: protectedOrgProcedure
    .input(createFeatureSchema)
    .output(z.object({ feature: featureSelectBaseSchema.optional() }))
    .mutation(async (opts) => {
      const { projectSlug, slug, title } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const featureId = utils.newIdEdge("feature")

      const featureDate = await opts.ctx.db
        .insert(schema.features)
        .values({
          id: featureId,
          slug,
          title,
          projectId: project.id,
        })
        .returning()

      return {
        feature: featureDate?.[0],
      }
    }),

  delete: protectedOrgProcedure
    .input(deleteFeatureSchema)
    .output(z.object({ feature: featureSelectBaseSchema.optional() }))
    .mutation(async (opts) => {
      const { projectSlug, id } = opts.input

      const { project: projectData } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const deletedFeature = await opts.ctx.db
        .delete(schema.features)
        .where(
          and(
            eq(schema.features.projectId, projectData.id),
            eq(schema.features.id, id)
          )
        )
        .returning()

      return {
        feature: deletedFeature?.[0],
      }
    }),
  update: protectedOrgProcedure
    .input(updateFeatureSchema.extend({ projectSlug: z.string() }))
    .output(z.object({ feature: featureSelectBaseSchema.optional() }))
    .mutation(async (opts) => {
      const { title, id, description, type, projectSlug } = opts.input

      const { project: projectData } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const featureData = await opts.ctx.db.query.features.findFirst({
        with: {
          project: {
            columns: {
              slug: true,
            },
          },
        },
        where: (feature, { eq, and }) =>
          and(eq(feature.id, id), eq(feature.projectId, projectData.id)),
      })

      if (!featureData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feature not found",
        })
      }

      const data = await opts.ctx.db
        .update(schema.features)
        .set({
          title,
          description,
          type,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.features.id, id),
            eq(schema.features.projectId, projectData.id)
          )
        )
        .returning()

      return {
        feature: data?.[0],
      }
    }),
  featureExist: protectedOrgProcedure
    .input(z.object({ slug: z.string(), projectSlug: z.string() }))
    .output(z.object({ exist: z.boolean() }))
    .mutation(async (opts) => {
      const { slug, projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const feature = await opts.ctx.db.query.features.findFirst({
        columns: {
          id: true,
        },
        where: (feature, { eq, and }) =>
          and(eq(feature.projectId, project.id), eq(feature.slug, slug)),
      })

      return {
        exist: !!feature,
      }
    }),
  getBySlug: protectedOrgProcedure
    .input(z.object({ slug: z.string(), projectSlug: z.string() }))
    .output(z.object({ feature: featureSelectBaseSchema.optional() }))
    .query(async (opts) => {
      const { slug, projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const feature = await opts.ctx.db.query.features.findFirst({
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

      return {
        feature: feature,
      }
    }),
  getById: protectedOrgProcedure
    .input(z.object({ id: z.string(), projectSlug: z.string() }))
    .output(z.object({ feature: featureSelectBaseSchema.optional() }))
    .query(async (opts) => {
      const { id, projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const feature = await opts.ctx.db.query.features.findFirst({
        with: {
          project: {
            columns: {
              slug: true,
            },
          },
        },
        where: (feature, { eq, and }) =>
          and(eq(feature.projectId, project.id), eq(feature.id, id)),
      })

      return {
        feature: feature,
      }
    }),

  searchBy: protectedOrgProcedure
    .input(
      z.object({
        projectSlug: z.string(),
        search: z.string().optional(),
      })
    )
    .output(z.object({ features: z.array(featureSelectBaseSchema) }))
    .query(async (opts) => {
      const { projectSlug, search } = opts.input
      const filter = `%${search}%`

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const features = await opts.ctx.db.query.features.findMany({
        where: (feature, { eq, and, or, ilike }) =>
          and(
            eq(feature.projectId, project.id),
            or(ilike(feature.slug, filter), ilike(feature.title, filter))
          ),
        orderBy: (feature, { desc }) => [
          desc(feature.updatedAt),
          desc(feature.title),
        ],
      })

      return {
        features: features,
      }
    }),

  listByProject: protectedOrgProcedure
    .input(z.object({ projectSlug: z.string() }))
    .output(z.object({ features: z.array(featureSelectBaseSchema) }))
    .query(async (opts) => {
      const { projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const features = await opts.ctx.db.query.features.findMany({
        where: (feature, { eq }) => eq(feature.projectId, project.id),
      })

      return {
        features: features,
      }
    }),
})
