import { Code } from "@unprice/ui/code"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { api } from "~/trpc/server"
import { RevalidateSession } from "./_components/revalidate-session"

type Props = {
  searchParams: {
    customer_id?: string
  }
}

export default async function PageSuccess(props: Props) {
  const customerId = props.searchParams.customer_id
  if (!customerId) {
    return (
      <EmptyPlaceholder>
        <EmptyPlaceholder.Title>Stripe is not configured</EmptyPlaceholder.Title>
        <EmptyPlaceholder.Description>
          If you are selfhosting Unkey, you need to configure Stripe in your environment variables.
        </EmptyPlaceholder.Description>
      </EmptyPlaceholder>
    )
  }

  const { customer } = await api.customers.getById({
    id: customerId,
  })

  if (!customer) {
    return (
      <EmptyPlaceholder>
        <EmptyPlaceholder.Title>Stripe session not found</EmptyPlaceholder.Title>
        <EmptyPlaceholder.Description>
          The Stripe customer <Code>{customerId}</Code> you are trying to access does not exist.
          Please contact support@unkey.dev.
        </EmptyPlaceholder.Description>
      </EmptyPlaceholder>
    )
  }

  // create a new workspace
  const { workspace } = await api.workspaces.create({
    name: customer.name,
    unPriceCustomerId: customer.id,
  })

  return <RevalidateSession newWorkspaceSlug={workspace.slug} />
}
