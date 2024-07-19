"use client"

import { Editor, Element, Frame } from "@craftjs/core"
import type { Page } from "@unprice/db/validators"
import {
  ContainerElement,
  FooterComponent,
  NovelComponent,
  PricingTableComponent,
  TextComponent,
} from "./components"
import { HeaderComponent } from "./components/header/header"
import { ConfiguratorSidebar } from "./viewport/configurator-sidebar"
import { HeaderEditor } from "./viewport/header-editor"
import { RenderNode } from "./viewport/render-node"
import { Viewport } from "./viewport/viewport"

export function EditorPageComponent({
  breadcrumbs,
  sidebar,
  data,
  page,
}: {
  breadcrumbs?: React.ReactNode
  sidebar?: React.ReactNode
  data?: string
  page: Omit<Page, "content">
}) {
  return (
    <div className="flex h-screen flex-col">
      <Editor
        resolver={{
          TextComponent,
          ContainerElement,
          NovelComponent,
          HeaderComponent,
          PricingTableComponent,
          FooterComponent,
        }}
        onRender={RenderNode}
        onNodesChange={(query) => {
          const _content = query.serialize()

          // console.log(json)
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
            <HeaderEditor page={page} />
            <Viewport>
              {breadcrumbs}
              <div className="flex flex-col items-center px-8 py-10">
                <Frame data={data}>
                  {/* // initial content if json is empty */}
                  {data === "" && (
                    // TODO: define a layout for the initial content
                    <Element canvas is={ContainerElement} custom={{ displayName: "App" }}>
                      <HeaderComponent links={[]} />
                      <TextComponent text="It's me again!" />
                      <PricingTableComponent plans={[]} />
                      <NovelComponent />
                      <FooterComponent links={[]} />
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
