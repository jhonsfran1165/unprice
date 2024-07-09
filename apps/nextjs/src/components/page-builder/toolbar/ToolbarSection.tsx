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
        <AccordionTrigger className="h-10 border-background-bgSubtle border-b bg-background-base px-2 [&>svg]:hidden hover:no-underline">
          <div className="flex w-full items-center justify-between">
            <h6>{title}</h6>
            {summary && props ? (
              <span className="font-normal text-background-solid text-xs lowercase">
                {summary(nodeProps as T)}
              </span>
            ) : null}
          </div>
        </AccordionTrigger>
        <AccordionContent className="flex w-full flex-col gap-4 pt-2 pb-4">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
