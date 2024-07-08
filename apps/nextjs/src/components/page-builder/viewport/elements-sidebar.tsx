import { Logo as LogoIcon } from "@builderai/ui/icons"
import { Tooltip, TooltipContent, TooltipTrigger } from "@builderai/ui/tooltip"
import { Element, useEditor } from "@craftjs/core"
import { ContainerIcon, FilePenLine, Text } from "lucide-react"
import { ContainerElement } from "../components/container"
import { Novel } from "../components/novel"
import { TextComponent } from "../components/text"

export function ElementsSidebar() {
  const {
    enabled,
    connectors: { create },
  } = useEditor((state) => ({
    enabled: state.options.enabled,
  }))
  if (!enabled) {
    return null
  }

  return (
    <nav className="left-0 z-40 h-full max-h-screen gap-2 inset-y-0 flex w-14 flex-col">
      <aside className="flex grow flex-col gap-y-6 overflow-y-auto border-r p-4 justify-center">
        <LogoIcon className={"size-6 text-primary-text"} />
        <nav aria-label="core navigation links" className="flex flex-1 flex-col space-y-6 py-6">
          <div
            ref={(ref) => {
              ref &&
                create(
                  ref,
                  <Element canvas is={ContainerElement} height={300} width={300}>
                    {""}
                  </Element>
                )
            }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <ContainerIcon className="size-6 cursor-grab" />
              </TooltipTrigger>
              <TooltipContent
                align="center"
                side="right" className="z-50 cursor-move">
                <div className="max-w-[200px] text-sm">Container Element</div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div
            ref={(ref) => {
              ref &&
                create(
                  ref,
                  <TextComponent text="It's me again!" />
                )
            }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Text className="size-6 cursor-grab" />
              </TooltipTrigger>
              <TooltipContent
                align="center"
                side="right" className="z-50 cursor-move">
                <div className="max-w-[200px] text-sm">Text Element</div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div
            ref={(ref) => {
              ref &&
                create(
                  ref,
                  <Novel />
                )
            }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <FilePenLine className="size-6 cursor-grab" />
              </TooltipTrigger>
              <TooltipContent
                align="center"
                side="right" className="z-50 cursor-move">
                <div className="max-w-[200px] text-sm">Notion like editor</div>
              </TooltipContent>
            </Tooltip>
          </div>
        </nav>
      </aside>
    </nav>
  )
}
