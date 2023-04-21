import { ShellSkeleton } from "@/components/layout/shell-skeleton"
import { OrganizationFormSkeleton } from "@/components/organizations/organization-form-skeleton"

export default function LoadingPage() {
  return (
    <div className="space-y-10 md:px-0">
      <OrganizationFormSkeleton />
      <ShellSkeleton />
      <ShellSkeleton />
    </div>
  )
}
// https://beta.nextjs.org/docs/data-fetching/fetching#parallel-data-fetching
