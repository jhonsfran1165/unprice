import { SubscriptionService } from "@unprice/services/subscriptions"
import { z } from "zod"

import { TRPCError } from "@trpc/server"
import { publicProcedure } from "#trpc"

export const testing = publicProcedure.input(z.void()).query(async (opts) => {
  const subscriptionService = new SubscriptionService(opts.ctx)

  const { err: errFinalizeInvoice, val: valFinalizeInvoice } =
    await subscriptionService.billingInvoice({
      invoiceId: "inv_1GatYPGYMnbtRz9sUiC5Y",
      projectId: "proj_1GRtWUw24S2k9XTxgFD7N",
      subscriptionId: "sub_1Gap1TgsKhES9ooTepLbT",
      now: Date.now(),
    })

  if (errFinalizeInvoice) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: errFinalizeInvoice.message,
    })
  }

  return {
    invoice: valFinalizeInvoice,
  }

  // // invoice first
  // const { err: errBilling, val: valBilling } = await subscriptionService.invoiceSubscription({
  //   subscriptionId: "sub_1Gap1TgsKhES9ooTepLbT",
  //   projectId: "proj_1GRtWUw24S2k9XTxgFD7N",
  //   now: Date.now(),
  // })

  // if (errBilling) {
  //   throw new TRPCError({
  //     code: "INTERNAL_SERVER_ERROR",
  //     message: errBilling.message,
  //   })
  // }

  // return {
  //   subscription: valBilling,
  // }
})
