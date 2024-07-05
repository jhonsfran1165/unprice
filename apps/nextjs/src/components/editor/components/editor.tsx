"use client"

import { Editor, Element, Frame } from "@craftjs/core"
import { RenderNode } from "../viewport/render-node"
import { Viewport } from "../viewport/viewport"
import { ContainerElement } from "./container"
import { Novel } from "./novel/editor"
import { TextComponent } from "./text"

export default function EditorComponent() {
  return (
    <Editor resolver={{ TextComponent, ContainerElement, Novel }} onRender={RenderNode}>
      <Viewport>
        <div className="flex-1">

          <Frame>
            <Element
              is={ContainerElement}
              padding={50}
              margin={20}
              background="#999"
              canvas
              custom={{
                displayName: "App",
              }}
            >
              <TextComponent fontSize="10px" text="It's me again!" />
              <Novel />
            </Element>
          </Frame>

        </div>
      </Viewport>
    </Editor>
  )
}
