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
  return <SubscriptionPlans />
}
