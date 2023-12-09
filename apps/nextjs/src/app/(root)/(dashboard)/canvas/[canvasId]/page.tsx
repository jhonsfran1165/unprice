import "@tldraw/tldraw/tldraw.css"

import dynamic from "next/dynamic"

const Editor = dynamic(
  async () => (await import("../_components/tldraw-editor")).default,
  {
    ssr: false,
  }
)

export default function CanvasPage({
  params,
}: {
  params: { canvasId: string }
}) {
  // TODO: validate canvasId with auth info
  // TODO: add loading state canvas
  return <Editor canvasId={params.canvasId} />
}
