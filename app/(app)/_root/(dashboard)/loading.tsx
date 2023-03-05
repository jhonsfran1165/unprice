import { DashboardShell } from "@/components/shared/dashboard/shell"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"

export default function LoadingPage() {
  return (
    <MaxWidthWrapper className="pt-10">
      <DashboardShell isLoading={true} />
    </MaxWidthWrapper>
  )
}
