import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import * as utils from "@unprice/db/utils"
import { featureInsertBaseSchema, featureSelectBaseSchema } from "@unprice/db/validators"

import { createTRPCRouter, protectedActiveProjectWorkspaceProcedure } from "../../trpc"

export const featureRouter = createTRPCRouter({
  create: protectedActiveProjectWorkspaceProcedure
    .input(featureInsertBaseSchema)
    .output(z.object({ feature: featureSelectBaseSchema }))
    .mutation(async (opts) => {
      const { description, slug, title } = opts.input
      const project = opts.ctx.project

      const featureId = utils.newId("feature")

      const featureData = await opts.ctx.db
        .insert(schema.features)
        .values({
          id: featureId,
          slug,
          title,
          projectId: project.id,
          description,
        })
        .returning()
        .then((data) => data[0])

      if (!featureData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating feature",
        })
      }

      return {
        feature: featureData,
      }
    }),

  remove: protectedActiveProjectWorkspaceProcedure
    .input(featureSelectBaseSchema.pick({ id: true }))
    .output(z.object({ feature: featureSelectBaseSchema }))
    .mutation(async (opts) => {
      const { id } = opts.input
      const project = opts.ctx.project

      const deletedFeature = await opts.ctx.db
        .delete(schema.features)
        .where(and(eq(schema.features.projectId, project.id), eq(schema.features.id, id)))
        .returning()
        .then((data) => data[0])

      if (!deletedFeature) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting feature",
        })
      }

      return {
        feature: deletedFeature,
      }
    }),
  update: protectedActiveProjectWorkspaceProcedure
    .input(
      featureSelectBaseSchema.pick({ id: true, title: true, description: true }).partial({
        description: true,
      })
    )
    .output(z.object({ feature: featureSelectBaseSchema }))
    .mutation(async (opts) => {
      const { title, id, description } = opts.input
      const project = opts.ctx.project

      const featureData = await opts.ctx.db.query.features.findFirst({
        where: (feature, { eq, and }) => and(eq(feature.id, id), eq(feature.projectId, project.id)),
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
          description: description ?? "",
          updatedAtM: Date.now(),
        })
        .where(and(eq(schema.features.id, id), eq(schema.features.projectId, project.id)))
        .returning()
        .then((data) => data[0])

      if (!data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error updating feature",
        })
      }

      return {
        feature: data,
      }
    }),
  exist: protectedActiveProjectWorkspaceProcedure
    .input(z.object({ slug: z.string() }))
    .output(z.object({ exist: z.boolean() }))
    .mutation(async (opts) => {
      const { slug } = opts.input
      const project = opts.ctx.project

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
  getBySlug: protectedActiveProjectWorkspaceProcedure
    .input(z.object({ slug: z.string() }))
    .output(z.object({ feature: featureSelectBaseSchema.optional() }))
    .query(async (opts) => {
      const { slug } = opts.input
      const project = opts.ctx.project

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
  getById: protectedActiveProjectWorkspaceProcedure
    .input(z.object({ id: z.string(), projectSlug: z.string() }))
    .output(z.object({ feature: featureSelectBaseSchema.optional() }))
    .query(async (opts) => {
      const { id } = opts.input
      const project = opts.ctx.project

      const feature = await opts.ctx.db.query.features.findFirst({
        with: {
          project: {
            columns: {
              slug: true,
            },
          },
        },
        where: (feature, { eq, and }) => and(eq(feature.projectId, project.id), eq(feature.id, id)),
      })

      return {
        feature: feature,
      }
    }),

  searchBy: protectedActiveProjectWorkspaceProcedure
    .input(
      z.object({
        search: z.string().optional(),
      })
    )
    .output(z.object({ features: z.array(featureSelectBaseSchema) }))
    .query(async (opts) => {
      const { search } = opts.input
      const project = opts.ctx.project

      const filter = `%${search}%`

      const features = await opts.ctx.db.query.features.findMany({
        where: (feature, { eq, and, or, ilike }) =>
          and(
            eq(feature.projectId, project.id),
            or(ilike(feature.slug, filter), ilike(feature.title, filter))
          ),
        orderBy: (feature, { desc }) => [desc(feature.updatedAtM), desc(feature.title)],
      })

      return {
        features: features,
      }
    }),

  listByActiveProject: protectedActiveProjectWorkspaceProcedure
    .input(z.void())
    .output(z.object({ features: z.array(featureSelectBaseSchema) }))
    .query(async (opts) => {
      const project = opts.ctx.project

      const features = await opts.ctx.db.query.features.findMany({
        where: (feature, { eq }) => eq(feature.projectId, project.id),
      })

      return {
        features: features,
      }
    }),
})
