"use client"

import type { Editor, TLShape } from "@tldraw/tldraw"
import { Icon, stopEventPropagation, track, useEditor } from "@tldraw/tldraw"

import { EDITOR_WIDTH } from "./code-editor"
import type { PreviewShape } from "./preview-page-shape"
import { showingEditor } from "./preview-page-shape"

export const ShowEditorButton = track(({ shape }: { shape: PreviewShape }) => {
  const showing = showingEditor.get()
  const editor = useEditor()
  return (
    <button
      style={{
        all: "unset",
        position: "absolute",
        top: 80,
        right: -40,
        height: 40,
        width: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        pointerEvents: "all",
      }}
      onClick={() => {
        editor.setSelectedShapes([shape.id])
        if (!showing) {
          showShapeNextToEditor(editor, shape)
        }
        showingEditor.set(!showing)
      }}
      onPointerDown={stopEventPropagation}
      title={showing ? "Hide editor" : "Show editor"}
    >
      <Icon icon={showing ? "following" : "follow"} />
    </button>
  )
})

export function showShapeNextToEditor(editor: Editor, shape: TLShape) {
  const bounds = editor.getViewportPageBounds()
  editor.centerOnPoint(
    {
      x:
        shape.x +
        bounds.width / 2 -
        (EDITOR_WIDTH + 40) / editor.getZoomLevel(),
      y: shape.y + bounds.height / 2 - 20 / editor.getZoomLevel(),
    },
    { duration: 320 }
  )
}
