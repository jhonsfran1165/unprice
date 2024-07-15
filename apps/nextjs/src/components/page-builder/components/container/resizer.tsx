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
    active,
    inNodeContext,
  } = useNode((node) => ({
    parent: node.data.parent,
    active: node.events.selected,
    nodeWidth: node.data.props[propKey.width] as Size["width"],
    nodeHeight: node.data.props[propKey.height] as Size["height"],
  }))

  const { isRootNode } = useEditor((_state, query) => {
    return {
      isRootNode: query.node(id).isRoot(),
    }
  })

  // won't allow resizing if the node is root
  const defaultWidth = isRootNode ? "100%" : nodeWidth
  const defaultHeight = isRootNode ? "auto" : nodeHeight

  // don't pass width and height to resizable if the node is root
  if (isRootNode) {
    delete props.style?.height
    delete props.style?.width
  }

  const resizable = useRef<Resizable | null>(null)
  const isResizing = useRef<boolean>(false)
  const editingDimensions = useRef<Size>({
    width: defaultWidth,
    height: defaultHeight,
  })

  const nodeDimensions = useRef<Size | null>(null)
  nodeDimensions.current = {
    width: defaultWidth,
    height: defaultHeight,
  }

  /**
   * Using an internal value to ensure the width/height set in the node is converted to px
   * because for some reason the <re-resizable /> library does not work well with percentages.
   */
  const [internalDimensions, setInternalDimensions] = useState({
    width: defaultWidth,
    height: defaultHeight,
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
  }, [defaultWidth, defaultHeight, updateInternalDimensionsWithOriginal])

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
      className={cn("flex", {
        "m-auto min-h-screen w-full border": isRootNode,
      })}
      ref={(ref) => {
        if (ref) {
          resizable.current = ref
          connect(resizable.current.resizable!)
        }
      }}
      size={internalDimensions}
      onResizeStart={(e) => {
        if (isRootNode) return
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
        if (isRootNode) return
        const dom = resizable.current?.resizable
        const { width, height } = getUpdatedDimensions(d?.width, d?.height)

        let calculatedWidth = width.toString()
        let calculatedHeight = height.toString()

        if (isPercentage(defaultWidth))
          calculatedWidth = `${pxToPercent(getElementDimensions(dom?.parentElement).width, width)}%`
        else calculatedWidth = `${width}px`

        if (isPercentage(defaultHeight))
          calculatedHeight = `${pxToPercent(
            getElementDimensions(dom?.parentElement).height,
            height
          )}%`
        else calculatedHeight = `${height}px`

        if (isPercentage(width) && dom?.parentElement?.style.width === "auto") {
          calculatedWidth = `${Number.parseInt((editingDimensions.current.width ?? 0).toString()) +
            Number.parseInt(d.width.toString())
            }px`
        }

        if (isPercentage(height) && dom?.parentElement?.style.height === "auto") {
          calculatedHeight = `${Number.parseInt((editingDimensions.current.height ?? 0).toString()) +
            Number.parseInt(d.height.toString())
            }px`
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
      {active && !isRootNode && (
        <div className={"pointer-events-none absolute top-0 left-0 h-full w-full"}>
          <span
            className={cn(
              "-left-1 -top-1 pointer-events-none absolute z-30 block size-2 rounded-full border-2 border-info bg-background-base shadow-sm"
            )}
          />
          <span className="-right-1 -top-1 pointer-events-none absolute z-30 block size-2 rounded-full border-2 border-info bg-background-base shadow-sm" />
          <span className="-left-1 -bottom-1 pointer-events-none absolute z-30 block size-2 rounded-full border-2 border-info bg-background-base shadow-sm" />
          <span className="-right-1 -bottom-1 pointer-events-none absolute z-30 block size-2 rounded-full border-2 border-info bg-background-base shadow-sm" />
        </div>
      )}
    </Resizable>
  )
}
