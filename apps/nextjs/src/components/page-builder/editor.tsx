"use client"

import { Editor, Element, Frame } from "@craftjs/core"
import { ContainerElement } from "./components/container"
import { Novel } from "./components/novel"
import { TextComponent } from "./components/text"
import { ConfiguratorSidebar } from "./viewport/configurator-sidebar"
import { HeaderEditor } from "./viewport/header-editor"
import { RenderNode } from "./viewport/render-node"
import { Viewport } from "./viewport/viewport"

export function EditorPageComponent({
  breadcrumbs,
  sidebar,
}: {
  breadcrumbs?: React.ReactNode
  sidebar?: React.ReactNode
}) {
  // const handleContentChange =

  return (
    <div className="flex h-screen flex-col">
      <Editor
        resolver={{ TextComponent, ContainerElement, Novel }}
        onRender={RenderNode}
        onNodesChange={(_query) => {
          // TODO: save content on change
          // console.log("dasdasdasd")
        }}
        indicator={{
          error: "var(--red-9)",
          success: "var(--green-9)",
          thickness: 3,
        }}
      >
        <div className={"flex flex-1 overflow-hidden"}>
          {sidebar}

          <main className="page-container flex flex-1 flex-col">
            <HeaderEditor />
            {breadcrumbs}
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
          </main>
          <ConfiguratorSidebar />
        </div>
      </Editor>
    </div>
  )
}
