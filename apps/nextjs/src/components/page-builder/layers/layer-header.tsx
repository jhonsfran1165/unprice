import { useEditor } from "@craftjs/core"

import { useLayer } from "@craftjs/layers"
import { Button } from "@unprice/ui/button"
import { cn } from "@unprice/ui/utils"
import { ChevronDown, ChevronUp, EyeIcon, EyeOffIcon, Rotate3DIcon } from "lucide-react"
import { LayerName } from "./layer-name"

export const LayerHeader = () => {
  const {
    id,
    depth,
    expanded,
    children,
    connectors: { drag, layerHeader },
    actions: { toggleLayer },
  } = useLayer((layer) => {
    return {
      expanded: layer.expanded,
    }
  })

  const { hidden, actions, selected, topLevel } = useEditor((state, query) => {
    // TODO: handle multiple selected elements
    const selected = query.getEvent("selected").first() === id

    return {
      hidden: state.nodes[id]! && state.nodes[id].data.hidden,
      selected,
      topLevel: query.node(id).isTopLevelCanvas(),
    }
  })

  return (
    <div
      className={cn("flex border-b", {
        "bg-info-bg text-info-text": selected,
      })}
      ref={(ref) => {
        ref && drag(ref)
      }}
    >
      <div
        ref={(ref) => {
          ref && layerHeader(ref)
        }}
        className={cn(
          "line-clamp-1 flex w-full items-center justify-between space-x-2 font-normal text-xs lowercase"
        )}
      >
        <Button
          size="icon"
          variant={"link"}
          onClick={() => {
            actions.setHidden(id, !hidden)
          }}
        >
          {hidden ? (
            <EyeOffIcon
              className={cn("size-4", {
                "text-info-text hover:text-info-textContrast": selected,
              })}
            />
          ) : (
            <EyeIcon
              className={cn("size-4", {
                "text-info-text hover:text-info-textContrast": selected,
              })}
            />
          )}
        </Button>

        {topLevel ? <Rotate3DIcon /> : null}

        {depth > 0 ? <div style={{ width: depth * 10 }} /> : null}

        <LayerName />

        {children?.length ? (
          <Button size="icon" variant={"link"} onMouseDown={() => toggleLayer()}>
            {!expanded ? (
              <ChevronDown
                className={cn("size-4", {
                  "text-info-text hover:text-info-textContrast": selected,
                })}
              />
            ) : (
              <ChevronUp
                className={cn("size-4", {
                  "text-info-text hover:text-info-textContrast": selected,
                })}
              />
            )}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
