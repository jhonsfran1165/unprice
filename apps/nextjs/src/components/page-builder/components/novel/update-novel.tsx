import { type JSONContent, useEditor } from "novel"
import { useCallback, useEffect } from "react"

// Novel won't update its content automatically, so we need to manually update it
export const NovelUpdate = ({
  content,
}: {
  content?: JSONContent
}) => {
  const { editor } = useEditor()

  const handleSave = useCallback(
    (c?: JSONContent) => {
      if (editor && c) {
        const json = editor.getJSON() as JSONContent

        if (JSON.stringify(c) === JSON.stringify(json)) return

        editor.commands.setContent(c)
      }
    },
    [editor]
  )

  useEffect(() => {
    handleSave(content)
  }, [JSON.stringify(content)])

  return null
}
