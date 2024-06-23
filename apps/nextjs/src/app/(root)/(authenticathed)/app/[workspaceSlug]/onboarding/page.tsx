import { Onboarding } from "./_components/multi-step-form"

export const runtime = "edge"

export default function OnboardingPage({
  params: { workspaceSlug },
}: {
  params: {
    workspaceSlug: string
  }
}) {
  return <Onboarding workspaceSlug={workspaceSlug} />
}
