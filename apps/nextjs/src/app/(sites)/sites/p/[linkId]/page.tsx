import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

const SCRIPT_TO_INJECT_FOR_PREVIEW = `
    // prevent the user from pinch-zooming into the iframe
    document.body.addEventListener('wheel', e => {
        if (!e.ctrlKey) return;
        e.preventDefault();
    }, { passive: false })
`

export const runtime = "edge"

export default function LinkPage({
  searchParams,
}: {
  params: { linkId: string }
  searchParams: { preview?: string; version: string }
}) {
  const isPreview = !!searchParams.preview

  const result = {
    slug: "test",
    html: "<h1>Test</h1>",
  }

  if (!result) return notFound()

  let html: string = result.html ?? ""

  if (isPreview) {
    html = html.includes("</body>")
      ? html.replace("</body>", `<script>${SCRIPT_TO_INJECT_FOR_PREVIEW}</script></body>`)
      : `${html}<script>${SCRIPT_TO_INJECT_FOR_PREVIEW}</script>`
  }

  return (
    <>
      <iframe
        title={result.slug}
        srcDoc={html}
        draggable={false}
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />
      {!isPreview}
    </>
  )
}
