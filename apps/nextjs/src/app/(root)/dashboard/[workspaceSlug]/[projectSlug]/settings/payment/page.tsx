import { api } from "~/trpc/server"
import { StripePaymentConfigForm } from "./_components/stripe-payment-config-form"

export default async function ProjectPaymentSettingsPage() {
  const provider = await api.paymentProvider.getConfig({
    paymentProvider: "stripe",
  })

  return (
    <StripePaymentConfigForm provider={provider.paymentProviderConfig} paymentProvider="stripe" />
  )
}
