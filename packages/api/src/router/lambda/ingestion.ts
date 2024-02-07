import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { zfd } from "zod-form-data"

import { schema, utils } from "@builderai/db"

import {
  createTRPCRouter,
  protectedApiFormDataProcedure,
  protectedOrgProcedure,
} from "../../trpc"
import { hasAccessToProject } from "../../utils"

const myFileValidator = z.preprocess(
  // @ts-expect-error - this is a hack. not sure why it's needed since it should already be a File
  (file: File) =>
    new File([file], file.name, {
      type: file.type,
      lastModified: file.lastModified,
    }),
  zfd.file(z.instanceof(File))
)

/**
 * FIXME: Not all of these have to run on lambda, just the upload one
 */

export const ingestionRouter = createTRPCRouter({
  byId: protectedOrgProcedure
    .input(z.object({ id: z.string() }))
    .query(async (opts) => {
      const ingestion = await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS.query.ingestion.findFirst({
          where: (ingestion, { eq }) => eq(ingestion.id, opts.input.id),
        })
      })

      if (!ingestion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ingestion not found",
        })
      }

      return ingestion
    }),

  list: protectedOrgProcedure
    .input(
      z.object({
        projectSlug: z.string(),
        limit: z.number().optional(),
      })
    )
    .query(async (opts) => {
      const projectSlug = opts.input.projectSlug

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const ingestions = await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS.query.ingestion.findMany({
          where: (ingestion, { eq }) => eq(ingestion.projectId, project.id),
          limit: opts.input.limit,
          orderBy: (ingestion, { desc }) => [desc(ingestion.createdAt)],
        })
      })

      return ingestions.map((ingestion) => ({
        ...ingestion,
        adds: Math.floor(Math.random() * 10),
        subs: Math.floor(Math.random() * 10),
      }))
    }),
  upload: protectedApiFormDataProcedure
    .input(
      zfd.formData({
        hash: zfd.text(),
        parent: zfd.text().optional(),
        origin: zfd.text(),
        schema: myFileValidator,
      })
    )
    .mutation(async (opts) => {
      const fileContent = await opts.input.schema.text()

      const id = utils.newId("ingestion")

      await opts.ctx.db.insert(schema.ingestion).values({
        id,
        projectId: opts.ctx.apiKey.projectId,
        hash: opts.input.hash,
        parent: opts.input.parent,
        origin: opts.input.origin,
        schema: fileContent,
        apikeyId: opts.ctx.apiKey.id,
        tenantId: opts.ctx.tenantId,
      })

      return { status: "ok" }
    }),
})
