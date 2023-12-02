import { useCallback } from "react"
import { useEditor, useToasts } from "@tldraw/tldraw"

import { api } from "~/trpc/client"
import { makeReal } from "./makeReal"

export function useMakeReal() {
  const editor = useEditor()
  const toast = useToasts()
  const createPage = api.page.create.useMutation()

  return useCallback(async () => {
    // TODO: not hard code this
    const apiKey = "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"

    try {
      const { html, id } = await makeReal(editor, apiKey)

      console.log(html)

      createPage.mutate({
        id,
        html,
        projectSlug: "cuddly-monkey",
      })
    } catch (e: any) {
      console.error(e)
      toast.addToast({
        icon: "cross-2",
        title: "Something went wrong",
        description: `${e.message.slice(0, 100)}`,
      })
    }
  }, [editor, toast])
}
