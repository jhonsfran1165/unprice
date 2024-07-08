"use client"

import { useEditor, useNode } from "@craftjs/core"
import debounce from "debounce"
import { Resizable, type ResizableProps, type Size } from "re-resizable"
import { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@builderai/ui/utils"
import {
  getElementDimensions,
  isPercentage,
  percentToPx,
  pxToPercent,
} from "./utils/numToMeasurement"

export const Resizer = ({
  propKey,
  children,
  ...props
}: ResizableProps & {
  propKey: { width: string; height: string }
}) => {
  const {
    id,
    actions: { setProp },
    connectors: { connect },
    nodeWidth,
    nodeHeight,
    parent,
    active,
    inNodeContext,
  } = useNode((node) => ({
    parent: node.data.parent,
    active: node.events.selected,
    nodeWidth: node.data.props[propKey.width] as Size["width"],
    nodeHeight: node.data.props[propKey.height] as Size["height"],
    fillSpace: node.data.props.fillSpace ?? "no",
  }))

  const { isRootNode } = useEditor((state, query) => {
    return {
      parentDirection:
        ((parent &&
          state.nodes[parent] &&
          state.nodes[parent].data.props.flexDirection) as string) ?? "column",
      isRootNode: query.node(id).isRoot(),
    }
  })

  const resizable = useRef<Resizable | null>(null)
  const isResizing = useRef<boolean>(false)
  const editingDimensions = useRef<Size>({
    width: nodeWidth,
    height: nodeHeight,
  })

  const nodeDimensions = useRef<Size | null>(null)
  nodeDimensions.current = {
    width: nodeWidth,
    height: nodeHeight,
  }

  /**
   * Using an internal value to ensure the width/height set in the node is converted to px
   * because for some reason the <re-resizable /> library does not work well with percentages.
   */
  const [internalDimensions, setInternalDimensions] = useState({
    width: nodeWidth,
    height: nodeHeight,
  })

  const updateInternalDimensionsInPx = useCallback(() => {
    const dimensions = nodeDimensions.current

    const width = percentToPx(
      getElementDimensions(resizable.current?.resizable?.parentElement!).width,
      dimensions?.width
    )
    const height = percentToPx(
      getElementDimensions(resizable.current?.resizable?.parentElement!).height,
      dimensions?.height
    )

    setInternalDimensions({
      width,
      height,
    })
  }, [])

  const updateInternalDimensionsWithOriginal = useCallback(() => {
    const dimensions = nodeDimensions.current
    setInternalDimensions({
      width: dimensions?.width,
      height: dimensions?.height,
    })
  }, [])

  const getUpdatedDimensions = (width: number, height: number) => {
    const dom = resizable.current?.resizable
    if (!dom)
      return {
        width: 0,
        height: 0,
      }

    const currentWidth = Number.parseInt(editingDimensions.current?.width?.toString() ?? "0")
    const currentHeight = Number.parseInt(editingDimensions.current?.height?.toString() ?? "0")

    return {
      width: currentWidth + width,
      height: currentHeight + height,
    }
  }

  useEffect(() => {
    if (!isResizing.current) updateInternalDimensionsWithOriginal()
  }, [nodeWidth, nodeHeight, updateInternalDimensionsWithOriginal])

  useEffect(() => {
    const listener = debounce(updateInternalDimensionsWithOriginal, 1)
    window.addEventListener("resize", listener)

    return () => {
      window.removeEventListener("resize", listener)
    }
  }, [updateInternalDimensionsWithOriginal])

  return (
    <Resizable
      enable={[
        "top",
        "left",
        "bottom",
        "right",
        "topLeft",
        "topRight",
        "bottomLeft",
        "bottomRight",
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      ].reduce((acc: any, key) => {
        acc[key] = active && inNodeContext
        return acc
      }, {})}
      className={cn([
        {
          "m-auto": isRootNode,
          flex: true,
        },
      ])}
      ref={(ref) => {
        if (ref) {
          resizable.current = ref
          connect(resizable.current.resizable!)
        }
      }}
      size={internalDimensions}
      onResizeStart={(e) => {
        updateInternalDimensionsInPx()
        e.preventDefault()
        e.stopPropagation()
        const dom = resizable.current?.resizable
        if (!dom) return
        editingDimensions.current = {
          width: dom.getBoundingClientRect().width,
          height: dom.getBoundingClientRect().height,
        }
        isResizing.current = true
      }}
      onResize={(_, __, ___, d) => {
        const dom = resizable.current?.resizable
        const { width, height } = getUpdatedDimensions(d?.width, d?.height)

        let calculatedWidth = width.toString()
        let calculatedHeight = height.toString()

        if (isPercentage(nodeWidth))
          calculatedWidth = `${pxToPercent(getElementDimensions(dom?.parentElement).width, width)}%`
        else calculatedWidth = `${width}px`

        if (isPercentage(nodeHeight))
          calculatedHeight = `${pxToPercent(
            getElementDimensions(dom?.parentElement).height,
            height
          )}%`
        else calculatedHeight = `${height}px`

        if (isPercentage(width) && dom?.parentElement?.style.width === "auto") {
          calculatedWidth = `${Number.parseInt((editingDimensions.current.width ?? 0).toString()) + Number.parseInt(d.width.toString())}px`
        }

        if (isPercentage(height) && dom?.parentElement?.style.height === "auto") {
          calculatedHeight = `${Number.parseInt((editingDimensions.current.height ?? 0).toString()) + Number.parseInt(d.height.toString())}px`
        }

        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        setProp((prop: any) => {
          prop[propKey.width] = calculatedWidth
          prop[propKey.height] = calculatedHeight
        }, 500)
      }}
      onResizeStop={() => {
        isResizing.current = false
        updateInternalDimensionsWithOriginal()
      }}
      {...props}
    >
      {children}
      {active && (
        <div className={"absolute top-0 left-0 w-full h-full pointer-events-none"}>
          <span
            className={cn(
              "absolute size-2 rounded-full block shadow-sm z-40 pointer-events-none border-2 border-info -left-1 -top-1 bg-background-base"
            )}
          />
          <span className="absolute size-2 rounded-full block shadow-sm z-40 pointer-events-none border-2 border-info -right-1 -top-1 bg-background-base" />
          <span className="absolute size-2 rounded-full block shadow-sm z-40 pointer-events-none border-2 border-info -left-1 -bottom-1 bg-background-base" />
          <span className="absolute size-2 rounded-full block shadow-sm z-40 pointer-events-none border-2 border-info -right-1 -bottom-1 bg-background-base" />
        </div>
      )}
    </Resizable>
  )
}
