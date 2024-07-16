"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@builderai/ui/accordion"
import { ScrollArea } from "@builderai/ui/scroll-area"
import { useEditor } from "@craftjs/core"
import { Layers } from "@craftjs/layers"
import { Edit, Layers as LayersIcon } from "lucide-react"
import { Toolbar } from "../toolbar"

export function ConfiguratorSidebar() {
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }))

  return (
    <nav className="inset-y-0 right-0 z-40 flex h-full min-h-screen w-64 flex-col xl:w-72">
      <aside className="flex h-full flex-col overflow-hidden border-l">
        <Accordion
          defaultValue={["customize", "layers"]}
          disabled={!enabled}
          type="multiple"
          className="flex h-full w-full flex-col"
        >
          <AccordionItem
            value="customize"
            className="flex flex-col transition data-[state=open]:h-full"
          >
            <AccordionTrigger className="h-14 border-b bg-background-bgSubtle px-2 shadow-sm hover:no-underline">
              <div className="flex w-full items-center justify-start px-2">
                <Edit className="mr-4 h-4 w-4" />
                <h5 className="text-normal">Customize</h5>
              </div>
            </AccordionTrigger>
            <AccordionContent className="flex h-full flex-col p-0">
              <ScrollArea>
                <Toolbar />
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value="layers"
            className="flex flex-col transition data-[state=open]:h-full"
          >
            <AccordionTrigger className="h-14 border-b bg-background-bgSubtle px-2 shadow-sm hover:no-underline">
              <div className="flex w-full items-center justify-start px-2">
                <LayersIcon className="mr-4 h-4 w-4" />
                <h5 className="text-normal">Layers</h5>
              </div>
            </AccordionTrigger>
            <AccordionContent className="flex h-full flex-col p-0">
              <ScrollArea>
                <Layers expandRootOnLoad />
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </aside>
    </nav>
  )
}
