import { Onboarding } from "./_components/multi-step-form"

export default function OnboardingPage({
  params: { workspaceSlug },
}: {
  params: {
    workspaceSlug: string
  }
}) {
  return <Onboarding workspaceSlug={workspaceSlug} />
}
