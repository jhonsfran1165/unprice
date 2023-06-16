import { EmptyState } from "@/components/shared/empty-state"

export const revalidate = 0

export default async function ProIndexPage({
  params: { orgSlug },
}: {
  params: {
    orgSlug: string
  }
}) {
  return (
    <EmptyState
      title="Welcome to PRO module"
      description="You are in a Paid Module"
    />
  )
}
