import { api } from "~/trpc/server"
import { StripePayment } from "./_components/stripe-payment"

export default async function ProjectPaymentSettingsPage() {
  const provider = await api.paymentProvider.getConfig({
    paymentProvider: "stripe",
  })

  return <StripePayment provider={provider.paymentProviderConfig} paymentProvider="stripe" />
}
