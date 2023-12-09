import { useCallback } from "react"
import { useEditor, useToasts } from "@tldraw/tldraw"

import { api } from "~/trpc/client"
import { makeReal } from "./makereal"
import { editorProjectSlug } from "./tldraw-editor"

export function useMakeReal() {
  const editor = useEditor()
  const toast = useToasts()
  const projectSlug = editorProjectSlug.get()
  const createPage = api.page.create.useMutation()

  return useCallback(async () => {
    // TODO: not hard code this
    const apiKey = process.env.OPENAI_API_KEY ?? ""

    try {
      const { html, id, version } = await makeReal(editor, apiKey)

      createPage.mutate({
        id,
        html,
        version,
        projectSlug: projectSlug,
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
