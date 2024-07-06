"use client"

import { Button } from "@builderai/ui/button"
import { useEditor, useNode } from "@craftjs/core"
import { ROOT_NODE } from "@craftjs/utils"
import { ArrowUp, Move, Trash } from "lucide-react"
import type React from "react"
import { Fragment, useCallback, useEffect, useRef } from "react"
import ReactDOM from "react-dom"

export const RenderNode = ({ render }: { render: React.ReactElement }) => {
  const { id } = useNode()

  const { actions, query, isActive } = useEditor((_, query) => ({
    isActive: query.getEvent("selected").contains(id),
  }))

  const {
    isHover,
    dom,
    name,
    moveable,
    deletable,
    connectors: { drag },
    parent,
  } = useNode((node) => ({
    isHover: node.events.hovered,
    dom: node.dom,
    name: node.data.custom.displayName || node.data.displayName,
    moveable: query.node(node.id).isDraggable(),
    deletable: query.node(node.id).isDeletable(),
    parent: node.data.parent,
    props: node.data.props,
  }))

  const currentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (dom) {
      if (isActive || isHover) dom.classList.add("component-selected")
      else dom.classList.remove("component-selected")
    }
  }, [dom, isActive, isHover])

  const getPos = useCallback((dom: HTMLElement) => {
    const { top, left, bottom } = dom ? dom.getBoundingClientRect() : { top: 0, left: 0, bottom: 0 }


    return {
      top: `${top > 0 ? top : bottom}px`,
      left: `${left}px`,
    }
  }, [])

  const scroll = useCallback(() => {
    const { current: currentDOM } = currentRef

    console.log("scroll", currentDOM)
    if (!currentDOM) return
    const { top, left } = getPos(dom)

    currentDOM.style.top = top
    currentDOM.style.left = left
  }, [getPos])

  useEffect(() => {
    document.querySelector(".craftjs-renderer")!.addEventListener("scroll", scroll)

    return () => {
      document.querySelector(".craftjs-renderer")!.removeEventListener("scroll", scroll)
    }
  }, [scroll])

  return (
    <Fragment>
      {isHover || isActive
        ? ReactDOM.createPortal(
          <div
            ref={currentRef}
            className="px-2 py-2 h-[30px] -mt-[32px] fixed flex items-center space-x-1 rounded-sm border bg-background-bg"
            style={{
              left: getPos(dom).left,
              top: getPos(dom).top,
              zIndex: 30,
            }}
          >
            <h6 className="flex-1 mr-4 text-sm">{name}</h6>
            {moveable ? (
              <Button size={"xs"} variant={"ghost"} className="cursor-move" ref={drag}>
                <Move className="size-3" />
              </Button>
            ) : null}
            {id !== ROOT_NODE && (
              <Button
                size={"xs"}
                variant={"ghost"}
                className="cursor-pointer"
                onClick={() => {
                  actions.selectNode(parent)
                }}
              >
                <ArrowUp className="size-4" />
              </Button>
            )}
            {deletable ? (
              <Button
                size={"xs"}
                variant={"ghost"}
                className="cursor-pointer"
                onMouseDown={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  actions.delete(id)
                }}
              >
                <Trash className="size-4" />
              </Button>
            ) : null}
          </div>,
          document.querySelector(".page-container")!
        )
        : null}
      {render}
    </Fragment>
  )
}
