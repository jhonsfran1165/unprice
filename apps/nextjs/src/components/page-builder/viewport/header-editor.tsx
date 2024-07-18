"use client"

import type { Page } from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
import { useEditor } from "@craftjs/core"
import { Redo, Undo } from "lucide-react"
import lz from "lzutf8"
import Link from "next/link"
import type React from "react"
import { startTransition } from "react"
import { SearchTool } from "~/components/layout/search"
import { SubmitButton } from "~/components/submit-button"
import { SITES_BASE_DOMAIN } from "~/constants"
import { api } from "~/trpc/client"

export const HeaderEditor: React.FC<{
  page: Omit<Page, "content">
}> = ({ page }) => {
  const { enabled, canUndo, canRedo, actions, query } = useEditor((state, query) => ({
    enabled: state.options.enabled,
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }))

  const domain = page.customDomain
    ? page.customDomain
    : `http://${page.subdomain}.${SITES_BASE_DOMAIN}`
  const updatePage = api.pages.update.useMutation({})

  function onUpdate() {
    startTransition(() => {
      const json = query.serialize()
      // actions.setOptions((options) => {
      //   options.enabled = !enabled
      // })
      const content = lz.encodeBase64(lz.compress(json))
      void updatePage.mutateAsync({ id: page.id, content: content })
    })
  }

  return (
    <div className="sticky top-0 z-40 flex h-14 flex-row items-center border-b bg-background-bgSubtle px-2 shadow-sm backdrop-blur-[2px]">
      {enabled && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            disabled={!canUndo}
            onClick={() => actions.history.undo()}
          >
            <Undo className="size-4" />
            <span className="sr-only">Undo</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={!canRedo}
            onClick={() => actions.history.redo()}
          >
            <Redo className="size-4" />
            <span className="sr-only">Redo</span>
          </Button>
        </div>
      )}
      <div className="flex flex-1 items-center justify-end space-x-2">
        <SubmitButton
          type="button"
          size={"sm"}
          isSubmitting={updatePage.isPending}
          isDisabled={updatePage.isPending}
          onClick={onUpdate}
          label={"Save"}
        />
        <Link href={domain} target="_blank">
          <Button size="sm" variant={"default"}>
            Preview
          </Button>
        </Link>

        <SearchTool className="hidden" />
      </div>
    </div>
  )
}
