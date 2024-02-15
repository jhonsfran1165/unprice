import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { zfd } from "zod-form-data"

import { schema, utils } from "@builderai/db"
import { ingestionSelectSchema } from "@builderai/validators/ingestion"

import {
  createTRPCRouter,
  protectedApiFormDataProcedure,
  protectedWorkspaceProcedure,
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
  byId: protectedWorkspaceProcedure
    .input(z.object({ id: z.string(), projectSlug: z.string() }))
    .output(ingestionSelectSchema)
    .query(async (opts) => {
      const projectSlug = opts.input.projectSlug

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const ingestion = await opts.ctx.db.query.ingestions.findFirst({
        where: (ingestion, { eq, and }) =>
          and(
            eq(ingestion.id, opts.input.id),
            eq(ingestion.projectId, project.id)
          ),
      })

      if (!ingestion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ingestion not found",
        })
      }

      return ingestion
    }),

  list: protectedWorkspaceProcedure
    .input(
      z.object({
        projectSlug: z.string(),
        limit: z.number().optional(),
      })
    )
    .output(
      z.array(
        ingestionSelectSchema.extend({ adds: z.number(), subs: z.number() })
      )
    )
    .query(async (opts) => {
      const projectSlug = opts.input.projectSlug

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const ingestions = await opts.ctx.db.query.ingestions.findMany({
        where: (ingestion, { eq }) => eq(ingestion.projectId, project.id),
        limit: opts.input.limit,
        orderBy: (ingestion, { desc }) => [desc(ingestion.createdAt)],
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
    .output(z.object({ status: z.literal("ok") }))
    .mutation(async (opts) => {
      const { schema: fileSchema, origin, hash, parent } = opts.input
      const fileContent = await fileSchema.text()
      const apiKey = opts.ctx.apiKey

      const id = utils.newId("ingestion")
      await opts.ctx.db.insert(schema.ingestions).values({
        id,
        projectId: apiKey.projectId,
        hash: hash,
        parent: parent,
        origin: origin,
        schema: fileContent,
        apiKeyId: apiKey.id,
      })

      return { status: "ok" }
    }),
})
