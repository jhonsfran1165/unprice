"use client"

import { Button } from "@builderai/ui/button"
import { Logo as LogoIcon } from "@builderai/ui/icons"
import { Tooltip, TooltipContent, TooltipTrigger } from "@builderai/ui/tooltip"
import { Element, useEditor } from "@craftjs/core"
import { ContainerIcon, FilePenLine, Layout, Table, Text } from "lucide-react"

import {
  ContainerElement,
  HeaderComponent,
  NovelComponent,
  PricingTableComponent,
  TextComponent,
} from "../components"

export function ElementsSidebar({
  children,
}: {
  children: React.ReactNode
}) {
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
    <nav className="inset-y-0 left-0 z-40 flex h-full max-h-screen w-14 flex-col gap-2">
      <aside className="flex grow flex-col items-center justify-center gap-y-6 overflow-y-auto border-r py-4">
        <LogoIcon className={"size-6 text-primary-text"} />
        <nav
          aria-label="core navigation links"
          className="flex flex-1 flex-col space-y-6 pt-6 transition"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size={"icon"}
                variant={"ghost"}
                className="cursor-grab"
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
                <ContainerIcon className="size-6 cursor-grab" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" align="end" alignOffset={25} className="w-[200px]">
              <div className="font-semibold text-sm">Container Element</div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size={"icon"}
                variant={"ghost"}
                className="cursor-grab"
                ref={(ref) => {
                  ref && create(ref, <TextComponent text="It's me again!" />)
                }}
              >
                <Text className="size-6 cursor-grab" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" align="end" alignOffset={25} className="w-[200px]">
              <div className="font-semibold text-sm">Text Element</div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size={"icon"}
                variant={"ghost"}
                className="cursor-grab"
                ref={(ref) => {
                  ref && create(ref, <NovelComponent />)
                }}
              >
                <FilePenLine className="size-6 cursor-grab" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" align="end" alignOffset={25} className="w-[200px]">
              <div className="font-semibold text-sm">Notion like editor</div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size={"icon"}
                variant={"ghost"}
                className="cursor-grab"
                ref={(ref) => {
                  ref && create(ref, <HeaderComponent links={[]} />)
                }}
              >
                <Layout className="size-6 cursor-grab" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" align="end" alignOffset={25} className="w-[200px]">
              <div className="font-semibold text-sm">Header</div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size={"icon"}
                variant={"ghost"}
                className="cursor-grab"
                ref={(ref) => {
                  ref && create(ref, <PricingTableComponent plans={[]} />)
                }}
              >
                <Table className="size-6 cursor-grab" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" align="end" alignOffset={25} className="w-[200px]">
              <div className="font-semibold text-sm">Pricing table</div>
            </TooltipContent>
          </Tooltip>

          {children}
        </nav>
      </aside>
    </nav>
  )
}
