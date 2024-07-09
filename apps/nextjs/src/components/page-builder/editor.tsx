"use client"

import { Editor, Element, Frame } from "@craftjs/core"
import { ContainerElement } from "./components/container"
import { Novel } from "./components/novel"
import { TextComponent } from "./components/text"
import { RenderNode } from "./viewport/render-node"
import { Viewport } from "./viewport/viewport"

export default function EditorComponent() {
  return (
    <div className="flex h-screen flex-col">
      <Editor resolver={{ TextComponent, ContainerElement, Novel }} onRender={RenderNode}>
        <Viewport>
          <Frame>
            <Element
              is={ContainerElement}
              canvas
              custom={{
                displayName: "App",
              }}
            >
              <TextComponent text="It's me again!" />
              <Novel />
            </Element>
          </Frame>
        </Viewport>
      </Editor>
    </div>
  )
}
