import type { JSONContent } from "novel"

export type NovelComponentProps = React.CSSProperties & {
  editorContent?: JSONContent
  editorHtml?: string
  radius?: number
  shadow?: number
  children?: React.ReactNode
}
