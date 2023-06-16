import SubscriptionPlans from "@/components/subscriptions/plans"

export default function IndexPage({
  params: { orgSlug, projectSlug },
  searchParams: { action },
}: {
  params: {
    orgSlug: string
    projectSlug: string
  }
  searchParams: {
    action: string
  }
}) {
  // TODO: split this component and create currentplan component
  // and available plans loadComponents. Then use all static elements
  // in this page so we can render from server
  return <SubscriptionPlans />
}
