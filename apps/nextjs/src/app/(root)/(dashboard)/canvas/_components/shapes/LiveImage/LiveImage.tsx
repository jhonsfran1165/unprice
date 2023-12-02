import { useCallback } from "react"
import { FrameShapeTool, useEditor } from "@tldraw/tldraw"

export class LiveImageTool extends FrameShapeTool {
  static override id = "live-image"
  static override initial = "idle"
  override shapeType = "live-image"
}

export function MakeLiveButton() {
  const editor = useEditor()
  const makeLive = useCallback(() => {
    editor.setCurrentTool("live-image")
  }, [editor])

  return (
    <button
      onClick={makeLive}
      className="p-2"
      style={{ cursor: "pointer", zIndex: 100000, pointerEvents: "all" }}
    >
      <div className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700">
        Draw Fast
      </div>
    </button>
  )
}
