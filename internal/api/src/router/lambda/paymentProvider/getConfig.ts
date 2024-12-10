import { selectPaymentProviderConfigSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

export const getConfig = protectedProjectProcedure
  .input(selectPaymentProviderConfigSchema.pick({ paymentProvider: true }))
  .output(z.object({ paymentProviderConfig: selectPaymentProviderConfigSchema.optional() }))
  .mutation(async (opts) => {
    // only owner and admin can cancel a subscription
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const { paymentProvider } = opts.input
    const projectId = opts.ctx.project.id

    // TODO: use this for configuration of payment providers
    // const aesGCM = await AesGCM.withBase64Key(env.ENCRYPTION_KEY)

    const config = await opts.ctx.db.query.paymentProviderConfig.findFirst({
      where: (table, { eq, and }) =>
        and(eq(table.projectId, projectId), eq(table.paymentProvider, paymentProvider)),
    })

    if (!config) {
      return { paymentProviderConfig: undefined }
    }

    // const decryptedKey = await aesGCM.decrypt({
    //   iv: config.keyIv,
    //   ciphertext: config.key,
    // })

    // return
    return {
      paymentProviderConfig: config,
    }
  })
