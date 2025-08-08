"use client"

import { useRouter } from "next/navigation"
import type { ElementRef } from "react"
import { forwardRef, startTransition } from "react"

import { Button } from "@unprice/ui/button"
import { LoadingAnimation } from "@unprice/ui/loading-animation"
import { toast } from "@unprice/ui/sonner"

import { useMutation } from "@tanstack/react-query"
import { ConfirmAction } from "~/components/confirm-action"
import { useTRPC } from "~/trpc/client"

export interface PagePublishProps extends React.ComponentPropsWithoutRef<"button"> {
  pageId: string
  onConfirmAction?: () => void
  classNames?: string
  variant?: "primary" | "custom"
}

const PagePublish = forwardRef<ElementRef<"button">, PagePublishProps>((props, ref) => {
  const { pageId, onConfirmAction, classNames, variant = "primary" } = props
  const router = useRouter()
  const trpc = useTRPC()

  const publishPage = useMutation(
    trpc.pages.publish.mutationOptions({
      onSuccess: () => {
        router.refresh()
      },
    })
  )

  function onPublishVersion() {
    startTransition(() => {
      toast.promise(
        publishPage.mutateAsync({
          id: pageId,
        }),
        {
          loading: "Publishing...",
          success: "Page published",
        }
      )
    })
  }

  return (
    <ConfirmAction
      message="Once you publish this page, it will be available to your customers. Are you sure you want to publish this page?"
      confirmAction={() => {
        onConfirmAction?.()
        onPublishVersion()
      }}
    >
      {/* // TODO: create a confetti animation or something in the first version published? */}
      <Button ref={ref} variant={variant} disabled={publishPage.isPending} className={classNames}>
        Publish
        {publishPage.isPending && <LoadingAnimation className={"ml-2"} />}
      </Button>
    </ConfirmAction>
  )
})

PagePublish.displayName = "PagePublish"

export { PagePublish }
