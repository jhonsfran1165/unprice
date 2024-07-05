import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@builderai/ui/accordion"
import { Separator } from "@builderai/ui/separator"
import { useNode } from "@craftjs/core"

export const ToolbarSection = ({ title, props, summary, children }: any) => {
  const { nodeProps } = useNode((node) => ({
    nodeProps:
      props &&
      props.reduce((res: any, key: any) => {
        res[key] = node.data.props[key] || null
        return res
      }, {}),
  }))
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <div className="px-6 w-full">{title}
            {summary && props ? (
              <h5 className="text-light-gray-2 text-sm text-right text-dark-blue">
                {summary(
                  props.reduce((acc: any, key: any) => {
                    acc[key] = nodeProps[key];
                    return acc;
                  }, {})
                )}
              </h5>
            ) : null}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Separator />
          <div className="container space-x-1">{children}</div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
