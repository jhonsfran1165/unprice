import { logger, task } from "@trigger.dev/sdk/v3"
import { db } from "@unprice/db"

export const billSubscription = task({
  id: "billing.subscription",
  run: async ({
    subscriptionId,
    currentCycleStartAt,
    currentCycleEndAt,
    invoiceId,
  }: {
    subscriptionId: string
    currentCycleStartAt: number
    currentCycleEndAt: number
    invoiceId: string
  }) => {
    // find the invoices for the subscription
    const invoice = await db.query.billingCycleInvoices.findFirst({
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.id, invoiceId),
          operators.eq(fields.subscriptionId, subscriptionId),
          operators.eq(fields.currentCycleStartAt, currentCycleStartAt),
          operators.eq(fields.currentCycleEndAt, currentCycleEndAt)
        )
      },
      with: {
        subscription: {
          with: {
            customer: true,
            planVersion: true,
            items: {
              with: {
                featurePlanVersion: true,
              },
            },
          },
        },
      },
    })

    if (!invoice) {
      logger.error(`Invoice ${invoiceId} not found`)
      return
    }

    if (invoice.status !== "draft") {
      logger.info(`Invoice ${invoiceId} is not in draft status`)
      return
    }
  },
})
