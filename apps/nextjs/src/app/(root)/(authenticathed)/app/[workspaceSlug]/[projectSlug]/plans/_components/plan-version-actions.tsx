"use client"

import { startTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"

import type { RouterOutputs } from "@builderai/api"
import type { PlanVersionFeature } from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@builderai/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@builderai/ui/dropdown-menu"
import { LoadingAnimation } from "@builderai/ui/loading-animation"
import { Separator } from "@builderai/ui/separator"

import { ConfirmAction } from "~/components/confirm-action"
import { toastAction } from "~/lib/toast"
import { api } from "~/trpc/client"
import { PlanVersionForm } from "../[planSlug]/_components/plan-version-form"
import { usePlanFeaturesList } from "./use-features"

const PlanVersionActions = ({
  planVersion,
}: {
  planVersion: RouterOutputs["planVersions"]["getByVersion"]["planVersion"]
}) => {
  const router = useRouter()
  const [planFeatures] = usePlanFeaturesList()

  // is valid when all features have config
  const isValidConfig = Object.values(planFeatures).every(
    (features: PlanVersionFeature[]) => {
      return features.every((feature) => {
        return feature.config !== undefined
      })
    }
  )

  const updateVersion = api.planVersions.update.useMutation({
    onSuccess: () => {
      toastAction("updated")
      router.refresh()
    },
  })

  function onPublishVersion() {
    startTransition(() => {
      if (planFeatures.planFeatures.length === 0) {
        toastAction(
          "error",
          "There are no features added to this plan. Please add features before publishing."
        )
        return
      }
      if (!isValidConfig) {
        toastAction(
          "error",
          "Please save configuration for each feature before publishing."
        )
        return
      }

      void updateVersion.mutateAsync({
        id: planVersion.id,
        featuresConfig: planFeatures.planFeatures,
        status: "published",
      })
    })
  }

  function onUpdateVersion() {
    startTransition(() => {
      if (planFeatures.planFeatures.length === 0) {
        toastAction(
          "error",
          "There are no features added to this plan. Please add features before publishing."
        )
        return
      }
      if (!isValidConfig) {
        toastAction(
          "error",
          "Please save configuration for each feature before publishing."
        )
        return
      }

      void updateVersion.mutateAsync({
        id: planVersion.id,
        featuresConfig: planFeatures.planFeatures,
      })
    })
  }

  return (
    <div className="button-primary flex items-center space-x-1 rounded-md ">
      <div className="sm:col-span-full">
        <ConfirmAction
          message="Once you publish this version, it will be available to your customers. You won't be able to edit it anymore. Are you sure you want to publish this version?"
          confirmAction={() => {
            onPublishVersion()
          }}
        >
          {/* // TODO: create a confetti animation or something in the first version published? */}
          <Button
            variant={"custom"}
            disabled={
              updateVersion.isPending || planVersion.status === "published"
            }
          >
            {planVersion.status === "published"
              ? "Published"
              : "Publish Version"}
            {updateVersion.isPending && <LoadingAnimation className={"ml-2"} />}
          </Button>
        </ConfirmAction>
      </div>

      <Separator orientation="vertical" className="h-[20px] p-0" />

      <Dialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={"custom"}>
              <ChevronDown className="h-4 w-4" />
              <span className="sr-only">More Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>More Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DialogTrigger asChild>
              <DropdownMenuItem>Edit version</DropdownMenuItem>
            </DialogTrigger>
            <DropdownMenuItem
              onClick={() => {
                onUpdateVersion()
              }}
            >
              Save config
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DialogContent>
          <PlanVersionForm defaultValues={planVersion} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PlanVersionActions
