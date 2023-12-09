/* eslint-disable jsx-a11y/no-static-element-interactions */
import { useState } from "react"
import type { OnChange } from "@monaco-editor/react"
import { Editor as MonacoEditor } from "@monaco-editor/react"
import {
  stopEventPropagation,
  track,
  useEditor,
  useIsDarkMode,
} from "@tldraw/tldraw"

import { api } from "~/trpc/client"
import type { PreviewShape } from "./preview-page-shape"
import { showingEditor } from "./preview-page-shape"
import { editorProjectSlug } from "./tldraw-editor"

export const EDITOR_WIDTH = 700

export const CodeEditor = track(() => {
  const editor = useEditor()
  const dark = useIsDarkMode()
  const bounds = editor.getViewportPageBounds()
  const shape = editor.getOnlySelectedShape()
  const previewShape =
    shape?.type === "preview" ? (shape as PreviewShape) : undefined

  const [value, setValue] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const showEditor = showingEditor.get()

  const projectSlug = editorProjectSlug.get()
  const updatePage = api.page.update.useMutation()

  const handleOnChange: OnChange = (value) => {
    setValue(value ?? "")
  }

  if (!bounds || !previewShape || !showEditor) return null

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          border: "1px solid #eee",
          pointerEvents: "all",
        }}
        onPointerDown={(e) => stopEventPropagation(e)}
        onKeyUp={() => {
          if (!value && value === "") return
          editor.updateShape<PreviewShape>({
            id: previewShape.id,
            type: "preview",
            props: {
              html: value,
            },
          })
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="absolute bottom-2.5 right-2.5 flex gap-2.5">
            <button
              onPointerDown={stopEventPropagation}
              onClick={(e) => {
                stopEventPropagation(e)
                showingEditor.set(false)
              }}
              className="z-10 box-border h-9 w-[80px] rounded border bg-white px-4 py-2 text-black hover:bg-gray-100"
              style={{
                pointerEvents: "all",
              }}
            >
              Dismiss
            </button>
            <button
              className="z-10 box-border h-9 w-[80px] rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-700"
              onClick={() => {
                setIsSaving(true)
                if (!value && value === "") return

                // Update the same version of the link
                updatePage.mutate({
                  id: previewShape.id,
                  html: value,
                  version: previewShape.props.version,
                  projectSlug,
                })

                // Update the preview shape
                editor.updateShape<PreviewShape>({
                  id: previewShape.id,
                  type: "preview",
                  props: {
                    html: value,
                    version: previewShape.props.version,
                  },
                })

                setIsSaving(false)
              }}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
          <div style={{ width: EDITOR_WIDTH, height: 700 }}>
            <MonacoEditor
              defaultLanguage="html"
              value={previewShape.props.html}
              onChange={handleOnChange}
              theme={dark ? "vs-dark" : "vs-light"}
              options={{
                renderLineHighlight: "none",
                overviewRulerBorder: false,
                overviewRulerLanes: 0,
                padding: {
                  top: 16,
                },
                minimap: {
                  enabled: false,
                },
                lineNumbers: "off",
                scrollbar: {
                  vertical: "hidden",
                },
                wordWrap: "wordWrapColumn",
                wordWrapColumn: 80,
                fontSize: 13,
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
})
