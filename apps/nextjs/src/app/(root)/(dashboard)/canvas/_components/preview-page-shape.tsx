"use client"

import { useEffect } from "react"
import type { TLBaseShape } from "@tldraw/tldraw"
import {
  atom,
  BaseBoxShapeUtil,
  DefaultSpinner,
  HTMLContainer,
  Icon,
  stopEventPropagation,
  toDomPrecision,
  useEditor,
  useIsEditing,
  useToasts,
  useValue,
  Vec2d,
} from "@tldraw/tldraw"

import { api } from "~/trpc/client"
import { ShowChatButton } from "./chat-button"
import { ShowEditorButton, showShapeNextToEditor } from "./editor-button"
import { Hint } from "./hint"
import { editorProjectSlug } from "./tldraw-editor"
import { UrlLinkButton } from "./url-button"

export const showingEditor = atom("showingEditor", false)

export type PreviewShape = TLBaseShape<
  "preview",
  {
    html: string
    source: string
    w: number
    h: number
    version: number
    uploadedShapeId?: string
  }
>

export function PreviewPage({ shape }: { shape: PreviewShape }) {
  const isEditing = useIsEditing(shape.id)
  const editor = useEditor()
  const showEditor = showingEditor.get()
  const toast = useToasts()

  const boxShadow = useValue(
    "box shadow",
    () => {
      const rotation = editor.getShapePageTransform(shape)!.rotation()
      return getRotatedBoxShadow(rotation)
    },
    [editor]
  )

  const { html, version, uploadedShapeId } = shape.props

  const updatePage = api.page.update.useMutation()

  // upload the html if we haven't already:
  useEffect(() => {
    let isCancelled = false
    if (html && (version === 0 || uploadedShapeId !== shape.id)) {
      updatePage.mutate({
        html,
        projectSlug: editorProjectSlug.get(),
        id: shape.id,
      })

      if (isCancelled) return

      editor.updateShape<PreviewShape>({
        id: shape.id,
        type: "preview",
        props: {
          version: 1,
          uploadedShapeId: shape.id,
        },
      })
    }
    return () => {
      isCancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape.id, html, version, uploadedShapeId])

  const isLoading = version === 0 || uploadedShapeId !== shape.id

  const uploadUrl = `/sites/p/${shape.id.replace(/^shape:/, "")}`

  return (
    <HTMLContainer className="tl-embed-container" id={shape.id}>
      {isLoading ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "var(--color-culled)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow,
            border: "1px solid var(--color-panel-contrast)",
            borderRadius: "var(--radius-2)",
          }}
        >
          <DefaultSpinner />
        </div>
      ) : (
        <>
          <iframe
            title={shape.id}
            src={
              showEditor
                ? undefined
                : `${uploadUrl}?preview=1&version=${version}`
            }
            srcDoc={showEditor ? html : undefined}
            width={toDomPrecision(shape.props.w)}
            height={toDomPrecision(shape.props.h)}
            draggable={true}
            style={{
              pointerEvents: isEditing ? "auto" : "none",
              boxShadow,
              border: "1px solid var(--color-panel-contrast)",
              borderRadius: "var(--radius-2)",
            }}
          />
          <button
            style={{
              all: "unset",
              position: "absolute",
              top: 0,
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
              void navigator?.clipboard?.writeText(shape.props.html)
              toast.addToast({
                icon: "code",
                title: "Copied html to clipboard",
              })
            }}
            onPointerDown={stopEventPropagation}
            title="Copy code to clipboard"
          >
            <Icon icon="code" />
          </button>
          <UrlLinkButton uploadUrl={uploadUrl} />
          <ShowEditorButton shape={shape} />
          <Hint isEditing={isEditing} />
          <ShowChatButton shape={shape} />
        </>
      )}
    </HTMLContainer>
  )
}

export class PreviewShapeUtil extends BaseBoxShapeUtil<PreviewShape> {
  static override type = "preview" as const

  getDefaultProps(): PreviewShape["props"] {
    return {
      html: "",
      source: "",
      version: 0,
      w: (960 * 2) / 3,
      h: (540 * 2) / 3,
    }
  }

  override canEdit = () => true
  override isAspectRatioLocked = (_shape: PreviewShape) => false
  override canResize = (_shape: PreviewShape) => true
  override canBind = (_shape: PreviewShape) => false
  override canUnmount = () => false

  override component(shape: PreviewShape) {
    return <PreviewPage shape={shape} />
  }

  override onClick = (shape: PreviewShape) => {
    if (!showingEditor.get()) return
    showShapeNextToEditor(this.editor, shape)
  }

  indicator(shape: PreviewShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}

const ROTATING_BOX_SHADOWS = [
  {
    offsetX: 0,
    offsetY: 2,
    blur: 4,
    spread: -1,
    color: "#0000003a",
  },
  {
    offsetX: 0,
    offsetY: 3,
    blur: 12,
    spread: -2,
    color: "#0000001f",
  },
]

function getRotatedBoxShadow(rotation: number) {
  const cssStrings = ROTATING_BOX_SHADOWS.map((shadow) => {
    const { offsetX, offsetY, blur, spread, color } = shadow
    const vec = new Vec2d(offsetX, offsetY)
    const { x, y } = vec.rot(-rotation)
    return `${x}px ${y}px ${blur}px ${spread}px ${color}`
  })
  return cssStrings.join(", ")
}
