import { TRPCError } from "@trpc/server"
import { z } from "zod"

import {
  featureSelectBaseSchema,
  pageInsertBaseSchema,
  pageSelectBaseSchema,
  planSelectBaseSchema,
  planVersionFeatureSelectBaseSchema,
  planVersionSelectBaseSchema,
} from "@builderai/db/validators"

import * as schema from "@builderai/db/schema"
import { newId } from "@builderai/db/utils"
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

      const pageData = await opts.ctx.db
        .insert(schema.pages)
        .values({
          id: pageId,
          name,
          projectId: project.id,
          content: {
            planVersions: [],
          },
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
  getByDomain: publicProcedure
    .input(
      z.object({
        domain: z.string(),
      })
    )
    .output(
      z.object({
        page: pageSelectBaseSchema.optional(),
        planVersions: planVersionSelectBaseSchema
          .extend({
            plan: planSelectBaseSchema,
            planFeatures: z.array(
              planVersionFeatureSelectBaseSchema.extend({
                feature: featureSelectBaseSchema,
              })
            ),
          })
          .array(),
      })
    )
    .query(async (opts) => {
      const { domain } = opts.input

      const pageData = await opts.ctx.db.query.pages.findFirst({
        where: (page, { eq, or }) => or(eq(page.customDomain, domain), eq(page.subdomain, domain)),
      })

      if (!pageData) {
        return {
          page: undefined,
          planVersions: [],
        }
      }

      const planVersions = await Promise.all(
        pageData.content.planVersions.map(async (planVersionId) => {
          return opts.ctx.db.query.versions
            .findFirst({
              with: {
                plan: true,
                planFeatures: {
                  with: {
                    feature: true,
                  },
                  orderBy(fields, operators) {
                    return operators.asc(fields.order)
                  },
                },
              },
              where: (version, { eq }) => eq(version.id, planVersionId),
            })
            .then((version) => version ?? null)
        })
      ).then((versions) => versions.filter((v) => v !== null))

      return {
        page: pageData,
        planVersions: planVersions,
      }
    }),
})
