"use client"

import { Editor, Element, Frame } from "@craftjs/core"
import { ContainerElement, Novel, TextComponent } from "./components"
import { ConfiguratorSidebar } from "./viewport/configurator-sidebar"
import { HeaderEditor } from "./viewport/header-editor"
import { RenderNode } from "./viewport/render-node"
import { Viewport } from "./viewport/viewport"

export function EditorPageComponent({
  breadcrumbs,
  sidebar,
  data,
}: {
  breadcrumbs?: React.ReactNode
  sidebar?: React.ReactNode
  data?: string
}) {
  // const handleContentChange =

  return (
    <div className="flex h-screen flex-col">
      <Editor
        resolver={{ TextComponent, ContainerElement, Novel }}
        onRender={RenderNode}
        onNodesChange={(query) => {
          const json = query.serialize()

          console.log(json)
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
            <Viewport>
              {breadcrumbs}
              <div className="flex flex-col items-center px-8 py-10">
                <Frame data={data}>
                  {/* // initial content if json is empty */}
                  {data === "" && (
                    <Element canvas is={ContainerElement} custom={{ displayName: "App" }} >
                      <TextComponent text="It's me again!" />
                      <Novel />
                    </Element>
                  )}
                </Frame>
              </div>

            </Viewport>
          </main>
          <ConfiguratorSidebar />
        </div>
      </Editor>
    </div>
  )
}
