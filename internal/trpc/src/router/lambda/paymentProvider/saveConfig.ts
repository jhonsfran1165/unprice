import { TRPCError } from "@trpc/server"
import { paymentProviderConfig } from "@unprice/db/schema"
import { AesGCM, newId } from "@unprice/db/utils"
import {
  insertPaymentProviderConfigSchema,
  selectPaymentProviderConfigSchema,
} from "@unprice/db/validators"
import { z } from "zod"

import { env } from "#env"
import { protectedProjectProcedure } from "#trpc"

export const saveConfig = protectedProjectProcedure
  .input(insertPaymentProviderConfigSchema)
  .output(z.object({ paymentProviderConfig: selectPaymentProviderConfigSchema }))
  .mutation(async (opts) => {
    // only owner and admin can cancel a subscription
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const { key, paymentProvider, active } = opts.input
    const projectId = opts.ctx.project.id
    const id = newId("payment_provider_config")

    const aesGCM = await AesGCM.withBase64Key(env.ENCRYPTION_KEY)

    const encryptedKey = await aesGCM.encrypt(key)

    // upsert
    const config = await opts.ctx.db
      .insert(paymentProviderConfig)
      .values({
        id,
        projectId,
        paymentProvider,
        active,
        key: encryptedKey.ciphertext,
        keyIv: encryptedKey.iv,
      })
      .onConflictDoUpdate({
        target: [paymentProviderConfig.paymentProvider, paymentProviderConfig.projectId],
        // if the invoice is pending, we update the cycle dates
        set: {
          active,
          key: encryptedKey.ciphertext,
          keyIv: encryptedKey.iv,
        },
      })
      .returning()
      .then((res) => res[0])
      .catch((e) => {
        opts.ctx.logger.error("Error creating payment provider config:", e)
        return undefined
      })

    if (!config) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error creating payment provider config",
      })
    }

    // return
    return { paymentProviderConfig: config }
  })
