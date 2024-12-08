import { api } from "~/trpc/server";
import { StripePayment } from "./_components/stripe-payment";

export default async function ProjectPaymentSettingsPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  return (
    <StripePayment
      projectPromise={api.projects.getBySlug({
        slug: props.params.projectSlug,
      })}
    />
  )
}
