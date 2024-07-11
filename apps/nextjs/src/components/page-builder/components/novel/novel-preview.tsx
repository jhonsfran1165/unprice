"use client"

import { MDXRemote, type MDXRemoteProps } from "next-mdx-remote"
import type { JSONContent } from "novel"

export type NovelProps = React.CSSProperties & {
  content: JSONContent
  html: string
  markdown: string
  radius: number
  shadow: number
}

export const NovelPreview = ({ mdxSource }: { mdxSource: MDXRemoteProps }) => {
  return (
    <article
      className={"prose-md prose prose-stone sm:prose-lg dark:prose-invert m-auto w-11/12 sm:w-3/4"}
      suppressHydrationWarning={true}
    >
      <MDXRemote {...mdxSource} />
    </article>
  )
}
