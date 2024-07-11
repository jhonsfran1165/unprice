"use client"

import { Separator } from "@builderai/ui/separator"
import { useEditor as useEditorCraft, useNode } from "@craftjs/core"
import type { EditorProps } from "@tiptap/pm/view"
import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  EditorRoot,
  type JSONContent,
} from "novel"
import { ImageResizer, handleCommandNavigation } from "novel/extensions"
import { handleImageDrop, handleImagePaste } from "novel/plugins"
import { useCallback, useMemo, useState } from "react"
import { defaultExtensions } from "./extensions"
import GenerativeMenuSwitch from "./generative/generative-menu-switch"
import { uploadFn } from "./image-upload"
import { ColorSelector } from "./selectors/color-selector"
import { LinkSelector } from "./selectors/link-selector"
import { NodeSelector } from "./selectors/node-selector"
import { TextButtons } from "./selectors/text-buttons"
import { NovelEditorSettings } from "./settings"
import { slashCommand, suggestionItems } from "./slash-command"
import { NovelUpdate } from "./update-novel"

const hljs = require("highlight.js")

const extensions = [...defaultExtensions, slashCommand]

export type NovelProps = React.CSSProperties & {
  content: JSONContent
  html: string
  markdown: string
  radius: number
  shadow: number
}

const defaultProps = {
  paddingLeft: 20,
  paddingRight: 20,
  paddingTop: 10,
  paddingBottom: 10,
  marginLeft: 0,
  marginRight: 0,
  marginTop: 0,
  marginBottom: 0,
  shadow: 0,
  radius: 0,
  html: "",
  markdown: "",
  content: {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Builderai is awesome" }],
      },
    ],
  } as JSONContent,
} as NovelProps

export const Novel = ({
  content,
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
}: Partial<NovelProps>) => {
  const {
    connectors: { connect },
    actions: { setProp },
  } = useNode()

  const [openNode, setOpenNode] = useState(false)
  const [openColor, setOpenColor] = useState(false)
  const [openLink, setOpenLink] = useState(false)
  const [openAI, setOpenAI] = useState(false)

  const { enabled } = useEditorCraft((state) => ({
    enabled: state.options.enabled,
  }))

  const highlightCodeblocks = useCallback((content: string) => {
    const doc = new DOMParser().parseFromString(content, "text/html")
    doc.querySelectorAll("pre code").forEach((el) => {
      hljs.highlightElement(el)
    })
    return new XMLSerializer().serializeToString(doc)
  }, [])

  const memoizedSuggestionItems = useMemo(() => suggestionItems, [])

  const editorProps: EditorProps = useMemo(
    () => ({
      handleDOMEvents: {
        keydown: (_view, event) => handleCommandNavigation(event),
      },
      handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
      handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
      attributes: {
        class:
          "prose prose-lg transition-colors dark:prose-invert prose-headings:font-primary prose-headings:text-background-textContrast focus:outline-none max-w-full prose-background-text font-normal",
      },
    }),
    []
  )

  return (
    <div
      className="flex w-full flex-col"
      ref={(ref) => {
        ref && connect(ref)
      }}
      style={{
        border: `${border}px solid ${borderColor}`,
        padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`,
        margin: `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px`,
        boxShadow: shadow === 0 ? "none" : `0px 3px 10px ${shadow}px rgba(0, 0, 0, 0.13)`,
        borderRadius: `${radius}px`,
      }}
    >
      <EditorRoot>
        <EditorContent
          editable={enabled}
          extensions={extensions}
          initialContent={content}
          onUpdate={({ editor }) => {
            const content = editor.getJSON() as JSONContent
            // html is useful for rendering the code blocks with styles
            const html = highlightCodeblocks(editor.getHTML()) as string
            // get the markdown content
            const markdown = editor.storage.markdown.getMarkdown() as string

            // console.log("html", html)
            // console.log("markdown", markdown)
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            setProp((props: Record<string, any>) => {
              props.content = content
              props.html = html
              props.markdown = markdown
              return props
            }, 500)
          }}
          className="w-full rounded-none border-none"
          editorProps={editorProps}
          slotAfter={<ImageResizer />}
        >
          <NovelUpdate content={content} />
          <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="px-2 text-muted-foreground">
              No results
            </EditorCommandEmpty>
            <EditorCommandList>
              {memoizedSuggestionItems.map((item) => (
                <EditorCommandItem
                  value={item.title}
                  onCommand={(val) => item.command!(val)}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-2 text-left text-sm aria-selected:bg-accent hover:bg-accent"
                  key={item.title}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground text-xs">{item.description}</p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>

          <GenerativeMenuSwitch open={openAI} onOpenChange={setOpenAI}>
            <Separator orientation="vertical" />
            <NodeSelector open={openNode} onOpenChange={setOpenNode} />
            <Separator orientation="vertical" />
            <LinkSelector open={openLink} onOpenChange={setOpenLink} />
            <Separator orientation="vertical" />
            <TextButtons />
            <Separator orientation="vertical" />
            <ColorSelector open={openColor} onOpenChange={setOpenColor} />
          </GenerativeMenuSwitch>
        </EditorContent>
      </EditorRoot>
    </div>
  )
}

Novel.craft = {
  displayName: "My page",
  props: defaultProps,
  related: {
    toolbar: NovelEditorSettings,
  },
}
