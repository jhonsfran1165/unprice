"use client"

import { useEditor as useEditorCraft, useNode } from "@craftjs/core"

import { Separator } from "@builderai/ui/separator";
import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList, EditorContent, EditorRoot, type JSONContent
} from "novel"
import { ImageResizer, handleCommandNavigation } from "novel/extensions";
import { handleImageDrop, handleImagePaste } from "novel/plugins";
import { useState } from "react";
import { defaultExtensions } from "./extensions"
import GenerativeMenuSwitch from "./generative/generative-menu-switch";
import { uploadFn } from "./image-upload";
import { ColorSelector } from "./selectors/color-selector";
import { LinkSelector } from "./selectors/link-selector";
import { NodeSelector } from "./selectors/node-selector";
import { TextButtons } from "./selectors/text-buttons";
import { slashCommand, suggestionItems } from "./slash-command";


const hljs = require('highlight.js');

const extensions = [...defaultExtensions, slashCommand];

export const Novel = ({
  content,
}: {
  content?: JSONContent
}) => {
  const {
    connectors: { connect },
    setProp,
  } = useNode()

  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openAI, setOpenAI] = useState(false);

  const { enabled } = useEditorCraft((state) => ({
    enabled: state.options.enabled,
  }))

  //Apply Codeblock Highlighting on the HTML from editor.getHTML()
  const _highlightCodeblocks = (content: string) => {
    const doc = new DOMParser().parseFromString(content, 'text/html');
    doc.querySelectorAll('pre code').forEach((el) => {
      // @ts-ignore
      // https://highlightjs.readthedocs.io/en/latest/api.html?highlight=highlightElement#highlightelement
      hljs.highlightElement(el);
    });
    return new XMLSerializer().serializeToString(doc);
  };

  return (
    <EditorRoot>
      <EditorContent
        ref={connect}
        disabled={!enabled}
        extensions={extensions}
        {...(content && { initialContent: content })}
        onUpdate={({ editor }) => {
          const json = editor.getJSON()


          // const html = highlightCodeblocks(editor.getHTML())
          // const content = JSON.stringify(json)
          // const markdown = editor.storage.markdown.getMarkdown()

          // console.log("html", html)
          // console.log("content", content)
          // console.log("markdown", markdown)

          // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
          setProp((props) => (props.content = json), 500)
        }}
        className="border py-4 px-8 rounded-sm"
        editorProps={{
          handleDOMEvents: {
            keydown: (_view, event) => handleCommandNavigation(event),
          },
          handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
          handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
          attributes: {
            class:
              "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full",
          },
        }}

        slotAfter={<ImageResizer />}
      >
        <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
          <EditorCommandEmpty className="px-2 text-muted-foreground">No results</EditorCommandEmpty>
          <EditorCommandList>
            {suggestionItems.map((item) => (
              <EditorCommandItem
                value={item.title}
                onCommand={(val) => item.command!(val)}
                className="flex w-full items-center space-x-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                key={item.title}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
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
  )
}

Novel.craft = {
  displayName: "Novel",
  props: {
    content: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Introducing Novel" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Introducing Novel" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Introducing Novel" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Introducing Novel" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Introducing Novel" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Introducing Novel" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Introducing Novel" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Introducing Novel" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Introducing Novel" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Introducing Novel" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Introducing Novel" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Introducing Novel" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Introducing Novel" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Introducing Novel" }],
        },
      ],
    }
  },
}
