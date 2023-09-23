import { auth } from "@builderai/auth"

import { Onboarding } from "./multi-step-form"

export const runtime = "edge"

export default function OnboardingPage() {
  const { orgSlug, user } = auth()

  return (
    <>
      <Onboarding workspaceSlug={orgSlug ?? user?.username ?? ""} />

      <div className="absolute inset-0 top-12 -z-10 bg-cover bg-center" />
    </>
  )
}
