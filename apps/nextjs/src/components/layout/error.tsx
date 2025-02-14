"use client"

import type { FeatureVerification } from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
import { useRouter } from "next/navigation"
import { BlurImage } from "~/components/blur-image"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { DashboardShell } from "~/components/layout/dashboard-shell"

export default function UpgradePlanError({ error }: { error?: FeatureVerification }) {
  const router = useRouter()

  return (
    <DashboardShell>
      <div className="flex flex-col items-center justify-center">
        <EmptyPlaceholder className="min-h-[800px] w-full space-y-10">
          <EmptyPlaceholder.Title className="mt-0 p-10" variant="h3">
            {error?.deniedReason ?? "You don't have access to this feature"}
          </EmptyPlaceholder.Title>
          <EmptyPlaceholder.Icon>
            <BlurImage
              alt="missing site"
              src="/app-launch.svg"
              width={400}
              height={400}
              className="invert-0 filter dark:invert"
            />
          </EmptyPlaceholder.Icon>
          <EmptyPlaceholder.Description className="mx-auto w-1/3 text-center">
            {error?.message ?? "You don't have access to this feature"}
          </EmptyPlaceholder.Description>
          <EmptyPlaceholder.Action>
            <div className="mt-6 flex flex-row items-center justify-center gap-10">
              {/* TODO: add update subscription button */}
              <Button variant="primary">Update plan</Button>
              <Button variant="default" onClick={() => router.back()}>
                Back
              </Button>
            </div>
          </EmptyPlaceholder.Action>
        </EmptyPlaceholder>
      </div>
    </DashboardShell>
  )
}
