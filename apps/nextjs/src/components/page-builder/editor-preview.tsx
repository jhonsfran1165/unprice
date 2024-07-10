"use client"

import { Editor, Frame } from "@craftjs/core"
import { ContainerElement } from "./components/container"
import { Novel } from "./components/novel"
import { TextComponent } from "./components/text"

export function EditorPreview({
  json,
}: {
  json: string
}) {
  return (
    <div className="flex h-screen w-full flex-col">
      <Editor enabled={false} resolver={{ TextComponent, ContainerElement, Novel }}>
        <Frame json={json} />
      </Editor>
    </div>
  )
}
