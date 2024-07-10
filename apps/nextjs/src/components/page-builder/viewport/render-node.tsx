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

  const { enabled, actions, query, isActive } = useEditor((state, query) => ({
    isActive: query.getEvent("selected").contains(id),
    enabled: state.options.enabled,
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

  const getPos = useCallback((dom: HTMLElement | null) => {
    const { top, left, bottom } = dom ? dom.getBoundingClientRect() : { top: 0, left: 0, bottom: 0 }

    return {
      top: `${top > 0 ? top : bottom}px`,
      left: `${left}px`,
    }
  }, [])

  const scroll = useCallback(() => {
    const { current: currentDOM } = currentRef

    if (!currentDOM) return
    const { top, left } = getPos(dom)

    currentDOM.style.top = top
    currentDOM.style.left = left
  }, [getPos])

  useEffect(() => {
    document.querySelector(".craftjs-renderer")?.addEventListener("scroll", scroll)

    return () => {
      document.querySelector(".craftjs-renderer")?.removeEventListener("scroll", scroll)
    }
  }, [scroll])

  return (
    <Fragment>
      {(isHover || isActive) && enabled
        ? ReactDOM.createPortal(
            <div
              ref={currentRef}
              className="-mt-[29px] info fixed flex h-[30px] items-center space-x-1 rounded-none border px-2 py-2"
              style={{
                left: getPos(dom).left,
                top: getPos(dom).top,
                zIndex: 30,
              }}
            >
              <h6 className="mr-4 flex-1 text-sm">{name}</h6>
              {moveable ? (
                <Button
                  size={"xs"}
                  variant={"custom"}
                  className="cursor-move"
                  ref={(ref) => {
                    ref && drag(ref)
                  }}
                >
                  <Move className="size-3" />
                </Button>
              ) : null}
              {id !== ROOT_NODE && (
                <Button
                  size={"xs"}
                  variant={"custom"}
                  className="cursor-pointer"
                  onClick={() => {
                    // there is always a parent - for the root node this option is disabled
                    actions.selectNode(parent!)
                  }}
                >
                  <ArrowUp className="size-4" />
                </Button>
              )}
              {deletable ? (
                <Button
                  size={"xs"}
                  variant={"custom"}
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
