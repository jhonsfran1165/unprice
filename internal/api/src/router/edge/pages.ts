import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { pageInsertBaseSchema, pageSelectBaseSchema } from "@builderai/db/validators"

import { and, eq } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import { createSlug, newId } from "@builderai/db/utils"
import { createTRPCRouter, protectedActiveProjectProcedure, publicProcedure } from "../../trpc"

export const pageRouter = createTRPCRouter({
  create: protectedActiveProjectProcedure
    .input(pageInsertBaseSchema)
    .output(
      z.object({
        page: pageSelectBaseSchema,
      })
    )
    .mutation(async (opts) => {
      const { name } = opts.input
      const project = opts.ctx.project

      const pageId = newId("page")
      const slug = createSlug()

      const pageData = await opts.ctx.db
        .insert(schema.pages)
        .values({
          id: pageId,
          slug,
          name,
          projectId: project.id,
        })
        .returning()
        .then((pageData) => {
          return pageData[0]
        })

      if (!pageData?.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "error creating page",
        })
      }

      return {
        page: pageData,
      }
    }),
  update: protectedActiveProjectProcedure
    .input(pageInsertBaseSchema.partial().required({ id: true }))
    .output(
      z.object({
        page: pageSelectBaseSchema,
      })
    )
    .mutation(async (opts) => {
      const { id, subdomain, customDomain, name, content } = opts.input
      const project = opts.ctx.project

      const pageData = await opts.ctx.db.query.pages.findFirst({
        where: (plan, { eq, and }) => and(eq(plan.id, id), eq(plan.projectId, project.id)),
      })

      if (!pageData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "plan not found",
        })
      }

      const updatedPage = await opts.ctx.db
        .update(schema.pages)
        .set({
          subdomain,
          customDomain,
          name,
          content,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.pages.id, id), eq(schema.pages.projectId, project.id)))
        .returning()
        .then((re) => re[0])

      if (!updatedPage) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error updating page",
        })
      }

      return {
        page: updatedPage,
      }
    }),
  getByDomain: publicProcedure
    .input(
      z.object({
        domain: z.string(),
      })
    )
    .output(
      z.object({
        page: pageSelectBaseSchema.optional(),
        // planVersions: planVersionSelectBaseSchema
        //   .extend({
        //     plan: planSelectBaseSchema,
        //     planFeatures: z.array(
        //       planVersionFeatureSelectBaseSchema.extend({
        //         feature: featureSelectBaseSchema,
        //       })
        //     ),
        //   })
        //   .array(),
      })
    )
    .query(async (opts) => {
      const { domain } = opts.input

      const pageData = await opts.ctx.db.query.pages.findFirst({
        where: (page, { eq, or }) => or(eq(page.customDomain, domain), eq(page.subdomain, domain)),
      })

      // if (!pageData) {
      //   return {
      //     page: undefined,
      //     planVersions: [],
      //   }
      // }

      // const planVersions = await Promise.all(
      //   pageData.content.planVersions.map(async (planVersionId) => {
      //     return opts.ctx.db.query.versions
      //       .findFirst({
      //         with: {
      //           plan: true,
      //           planFeatures: {
      //             with: {
      //               feature: true,
      //             },
      //             orderBy(fields, operators) {
      //               return operators.asc(fields.order)
      //             },
      //           },
      //         },
      //         where: (version, { eq }) => eq(version.id, planVersionId),
      //       })
      //       .then((version) => version ?? null)
      //   })
      // ).then((versions) => versions.filter((v) => v !== null))

      return {
        page: pageData,
        // planVersions: planVersions,
      }
    }),
  remove: protectedActiveProjectProcedure
    .input(pageSelectBaseSchema.pick({ id: true }))
    .output(z.object({ page: pageSelectBaseSchema }))
    .mutation(async (opts) => {
      const { id } = opts.input
      const project = opts.ctx.project

      const deletedPage = await opts.ctx.db
        .delete(schema.pages)
        .where(and(eq(schema.pages.projectId, project.id), eq(schema.pages.id, id)))
        .returning()
        .then((data) => data[0])

      if (!deletedPage) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting page",
        })
      }

      return {
        page: deletedPage,
      }
    }),

  listByActiveProject: protectedActiveProjectProcedure
    .input(
      z.object({
        fromDate: z.number().optional(),
        toDate: z.number().optional(),
      })
    )
    .output(
      z.object({
        pages: z.array(pageSelectBaseSchema.extend({})),
      })
    )
    .query(async (opts) => {
      const { fromDate, toDate } = opts.input
      const project = opts.ctx.project

      const pages = await opts.ctx.db.query.pages.findMany({
        where: (page, { eq, and, between, gte, lte }) =>
          and(
            eq(page.projectId, project.id),
            fromDate && toDate
              ? between(page.createdAt, new Date(fromDate), new Date(toDate))
              : undefined,
            fromDate ? gte(page.createdAt, new Date(fromDate)) : undefined,
            toDate ? lte(page.createdAt, new Date(toDate)) : undefined
          ),
      })

      return {
        pages,
      }
    }),
})
