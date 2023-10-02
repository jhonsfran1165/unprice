import { notFound } from "next/navigation"

import { auth } from "@builderai/auth"

import Header from "~/components/header"
import { Onboarding } from "./multi-step-form"

// TODO: activate later. It is  hitting limits on vercel
// export const runtime = "edge"

export default function OnboardingPage() {
  const { orgSlug, sessionClaims } = auth()

  const workspaceSlug = orgSlug ?? (sessionClaims?.username as string) ?? ""

  if (!workspaceSlug) {
    notFound()
  }

  return (
    <>
      <Header showTabs={false} />
      <Onboarding workspaceSlug={workspaceSlug} />
      <div className="absolute inset-0 top-12 -z-10 bg-cover bg-center" />
    </>
  )
}
