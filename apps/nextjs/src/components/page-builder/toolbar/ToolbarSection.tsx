import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@builderai/ui/accordion"
import { useNode } from "@craftjs/core"
import type React from "react"

type Props<T extends Record<string, unknown>> = {
  title: string
  props: (keyof T)[]
  summary?: (props: T) => string | React.ReactNode
  children: React.ReactNode
}

export const ToolbarSection = <T extends Record<string, unknown>>({
  title,
  props,
  summary,
  children,
}: Props<T>) => {
  const { nodeProps } = useNode((node) => ({
    nodeProps: props.reduce(
      (res, key) => {
        if (key in node.data.props) {
          res[key] = node.data.props[key as string]
        }
        return res
      },
      {} as Partial<T>
    ),
  }))

  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger className="h-10 px-2 hover:no-underline border-b bg-background-base border-background-bgSubtle [&>svg]:hidden">
          <div className="w-full flex justify-between items-center">
            <h6>{title}</h6>
            {summary && props ? (
              <span className="font-normal text-xs text-background-solid lowercase">
                {summary(nodeProps as T)}
              </span>
            ) : null}
          </div>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col w-full gap-4 pt-2 pb-4">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
