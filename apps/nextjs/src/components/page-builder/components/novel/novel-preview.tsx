import type { NovelComponentProps } from "./types"

export const NovelPreview = (props: NovelComponentProps) => {
  const {
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    shadow,
    radius,
    borderColor,
    border,
    editorHtml,
  } = props

  // Extract the content from the body tag
  // const bodyContent = editorHtml?.match(/<body>([\s\S]*?)<\/body>/)?.[1] || ""
  const bodyContent = editorHtml ?? ""

  return (
    <div
      className="flex w-full flex-col"
      style={{
        border: `${border}px solid ${borderColor}`,
        padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`,
        margin: `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px`,
        boxShadow: shadow === 0 ? "none" : `0px 3px 10px ${shadow}px rgba(0, 0, 0, 0.13)`,
        borderRadius: `${radius}px`,
      }}
    >
      <article
        className={
          "prose prose-lg dark:prose-invert prose-background-text max-w-full font-normal transition-colors prose-headings:font-sans prose-headings:text-background-textContrast focus:outline-none"
        }
        suppressHydrationWarning={true}
        dangerouslySetInnerHTML={{ __html: bodyContent }}
      />
    </div>
  )
}
