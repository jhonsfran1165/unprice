import { protectedApiFormDataProcedure } from "#/trpc"
import * as schema from "@unprice/db/schema"
import * as utils from "@unprice/db/utils"
import { z } from "zod"
import { zfd } from "zod-form-data"

const myFileValidator = z.preprocess(
  // @ts-expect-error - this is a hack. not sure why it's needed since it should already be a File
  (file: File) =>
    new File([file], file.name, {
      type: file.type,
      lastModified: file.lastModified,
    }),
  zfd.file(z.instanceof(File))
)

export const upload = protectedApiFormDataProcedure
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
      apikeyId: apiKey.id,
      schema: fileContent,
      origin,
      hash,
      parent,
    })

    return { status: "ok" }
  })
