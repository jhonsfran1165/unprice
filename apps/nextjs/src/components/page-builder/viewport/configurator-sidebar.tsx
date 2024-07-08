import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@builderai/ui/accordion"
import { useEditor } from "@craftjs/core";
import { Layers } from '@craftjs/layers';
import { Edit, Layers as LayersIcon } from "lucide-react"
import { Toolbar } from "../toolbar"

export function ConfiguratorSidebar() {
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }))

  return (
    <nav className="right-0 z-40 h-full max-h-screen inset-y-0 flex w-64 flex-col xl:w-72">
      <aside className="flex grow flex-col overflow-y-auto border-l">
        <Accordion
          defaultValue={["customize", "layers"]}
          disabled={!enabled} type="multiple" className="w-full flex flex-col h-full">
          <AccordionItem value="customize" className="flex flex-col data-[state=open]:flex-grow transition">
            <AccordionTrigger className="h-14 px-2 shadow-sm bg-background-bgSubtle hover:no-underline border-b">
              <div className="w-full flex px-2 items-center justify-start">
                <Edit className="h-4 w-4 mr-4" />
                <h5 className="text-normal">Customize</h5>
              </div>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col h-full">
              <Toolbar />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="layers" className="flex flex-col data-[state=open]:flex-grow transition">
            <AccordionTrigger className="h-14 px-2 shadow-sm bg-background-bgSubtle hover:no-underline border-b">
              <div className="w-full flex px-2 items-center justify-start">
                <LayersIcon className="h-4 w-4 mr-4" />
                <h5 className="text-normal">Layers</h5>
              </div>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col h-full">
              {/* // TODO: modify layers styles */}
              <Layers />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

      </aside>
    </nav>
  )
}
