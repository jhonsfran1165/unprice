import { env } from "#env.mjs"
import { db } from "@unprice/db"
import { AesGCM } from "@unprice/db/utils"
import type { Customer, PaymentProvider } from "@unprice/db/validators"
import type { Logger } from "@unprice/logging"
import { PaymentProviderService } from "../payment-provider"

/**
 * Validates payment status with proper error handling
 */
export const validatePaymentMethod = async ({
  customer,
  paymentProvider,
  requiredPaymentMethod,
  logger,
}: {
  customer: Customer
  paymentProvider?: PaymentProvider
  requiredPaymentMethod?: boolean
  logger: Logger
}): Promise<{
  paymentMethodId: string | null
  requiredPaymentMethod: boolean
}> => {
  if (!requiredPaymentMethod) {
    return {
      paymentMethodId: null,
      requiredPaymentMethod: false,
    }
  }

  if (!paymentProvider) {
    return {
      paymentMethodId: null,
      requiredPaymentMethod: false,
    }
  }

  // get config payment provider
  const config = await db.query.paymentProviderConfig.findFirst({
    where: (config, { and, eq }) =>
      and(
        eq(config.projectId, customer.projectId),
        eq(config.paymentProvider, paymentProvider),
        eq(config.active, true)
      ),
  })

  if (!config) {
    throw new Error("Payment provider config not found or not active")
  }

  const aesGCM = await AesGCM.withBase64Key(env.ENCRYPTION_KEY)

  const decryptedKey = await aesGCM.decrypt({
    iv: config.keyIv,
    ciphertext: config.key,
  })

  const paymentProviderService = new PaymentProviderService({
    customer,
    paymentProvider,
    logger: logger,
    token: decryptedKey,
  })

  const { err: paymentMethodErr, val: paymentMethodId } =
    await paymentProviderService.getDefaultPaymentMethodId()

  if (paymentMethodErr) {
    throw new Error(`Payment validation failed: ${paymentMethodErr.message}`)
  }

  if (requiredPaymentMethod && !paymentMethodId?.paymentMethodId) {
    throw new Error("Required payment method not found")
  }

  return {
    paymentMethodId: paymentMethodId.paymentMethodId,
    requiredPaymentMethod: true,
  }
}
