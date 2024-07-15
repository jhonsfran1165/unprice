import { Button } from "@builderai/ui/button"
import { useEditor, useNode } from "@craftjs/core"
import { Fragment } from "react"
import { BACKGROUND_COLORS, TEXT_COLORS } from "~/lib/theme"
import { ToolbarSection } from "../../toolbar"
import { ToolbarItemDropdown } from "../../toolbar/ToolbarItemDropdown"
import { ToolbarItemRadio } from "../../toolbar/ToolbarItemRadio"
import { ToolbarItemSlider } from "../../toolbar/ToolbarItemSlider"
import { ToolbarItemText } from "../../toolbar/ToolbarItemText"
import type { ContainerComponentProps } from "./types"

export const ContainerSettings = () => {
  const { id, actions, data } = useNode((node) => ({
    data: node.data.props as ContainerComponentProps,
  }))

  const setProp = actions.setProp as (
    cb: (props: ContainerComponentProps) => void,
    throttleRate?: number
  ) => void

  const { isRootNode } = useEditor((_state, query) => {
    return {
      isRootNode: query.node(id).isRoot(),
    }
  })

  return (
    <Fragment>
      {/* // don't allow to change width and height for the root node. default value on root node
      should be 100% with and height 100% */}
      {!isRootNode && (
        <ToolbarSection
          title="Dimensions"
          props={["width", "height"]}
          summary={({ width, height }) => {
            return `${width} x ${height}`
          }}
        >
          <div className="flex w-full items-center space-x-4">
            <ToolbarItemText
              value={data.width}
              label="Width"
              onChange={(width) => {
                setProp((props) => {
                  props.width = width
                }, 500)
              }}
            />
            <ToolbarItemText
              value={data.height}
              label="Height"
              onChange={(height) => {
                setProp((props) => {
                  props.height = height
                }, 500)
              }}
            />
          </div>
        </ToolbarSection>
      )}

      {!isRootNode && (
        <ToolbarSection
          title="Margin"
          props={["marginLeft", "marginRight", "marginTop", "marginBottom"]}
          summary={({ marginLeft, marginRight, marginTop, marginBottom }) => {
            return `${marginLeft}px, ${marginRight}px, ${marginTop}px, ${marginBottom}px`
          }}
        >
          <div className="flex w-full items-center space-x-4">
            <div className="flex w-1/2 flex-col gap-4">
              <ToolbarItemSlider
                label="Left"
                max={120}
                min={0}
                value={(data.marginLeft as number) ?? 0}
                onChange={(marginLeft) => {
                  setProp((props) => {
                    props.marginLeft = marginLeft
                  }, 500)
                }}
              />
              <ToolbarItemSlider
                label="Right"
                max={120}
                min={0}
                value={(data.marginRight as number) ?? 0}
                onChange={(marginRight) => {
                  setProp((props) => {
                    props.marginRight = marginRight
                  }, 500)
                }}
              />
            </div>

            <div className="flex w-1/2 flex-col gap-4">
              <ToolbarItemSlider
                label="Top"
                max={120}
                min={0}
                value={(data.marginTop as number) ?? 0}
                onChange={(marginTop) => {
                  setProp((props) => {
                    props.marginTop = marginTop
                  }, 500)
                }}
              />
              <ToolbarItemSlider
                label="Bottom"
                max={120}
                min={0}
                value={(data.marginBottom as number) ?? 0}
                onChange={(marginBottom) => {
                  setProp((props) => {
                    props.marginBottom = marginBottom
                  }, 500)
                }}
              />
            </div>
          </div>
        </ToolbarSection>
      )}

      <ToolbarSection
        title="Padding"
        props={["paddingLeft", "paddingRight", "paddingTop", "paddingBottom"]}
        summary={({ paddingLeft, paddingRight, paddingTop, paddingBottom }) => {
          return `${paddingLeft}px, ${paddingRight}px, ${paddingTop}px, ${paddingBottom}px`
        }}
      >
        <div className="flex w-full items-center space-x-4">
          <div className="flex w-1/2 flex-col gap-4">
            <ToolbarItemSlider
              label="Left"
              max={120}
              min={0}
              value={(data.paddingLeft as number) ?? 0}
              onChange={(paddingLeft) => {
                setProp((props) => {
                  props.paddingLeft = paddingLeft
                }, 500)
              }}
            />
            <ToolbarItemSlider
              label="Right"
              max={120}
              min={0}
              value={(data.paddingRight as number) ?? 0}
              onChange={(paddingRight) => {
                setProp((props) => {
                  props.paddingRight = paddingRight
                }, 500)
              }}
            />
          </div>

          <div className="flex w-1/2 flex-col gap-4">
            <ToolbarItemSlider
              label="Top"
              max={120}
              min={0}
              value={(data.paddingTop as number) ?? 0}
              onChange={(paddingTop) => {
                setProp((props) => {
                  props.paddingTop = paddingTop
                }, 500)
              }}
            />
            <ToolbarItemSlider
              label="Bottom"
              max={120}
              min={0}
              value={(data.paddingBottom as number) ?? 0}
              onChange={(paddingBottom) => {
                setProp((props) => {
                  props.paddingBottom = paddingBottom
                }, 500)
              }}
            />
          </div>
        </div>
      </ToolbarSection>

      {!isRootNode && (
        <ToolbarSection
          title="Appearance"
          props={["backgroundColor", "shadow", "radius", "border", "borderColor"]}
          summary={({ backgroundColor, shadow, radius, border, borderColor }) => {
            return (
              <div className="flex items-center gap-2">
                <div
                  className="px-2 py-1 font-medium"
                  style={{
                    backgroundColor: backgroundColor as string,
                    textShadow: `0px 0px 2px rgba(0,0,0,${((shadow as number) || 0) / 100})`,
                    borderRadius: `${radius}px`,
                    border: `${border}px solid ${borderColor}`,
                  }}
                >
                  A
                </div>
              </div>
            )
          }}
        >
          <ToolbarItemSlider
            label="Border"
            max={5}
            min={0}
            value={(data.border as number) ?? 0}
            onChange={(border) => {
              setProp((props) => {
                props.border = border
              }, 500)
            }}
          />
          <ToolbarItemSlider
            label="Shadow"
            max={100}
            min={0}
            value={(data.shadow as number) ?? 0}
            onChange={(shadow) => {
              setProp((props) => {
                props.shadow = shadow
              }, 500)
            }}
          />
          <ToolbarItemSlider
            label="Radius"
            max={100}
            min={0}
            value={(data.radius as number) ?? 0}
            onChange={(radius) => {
              setProp((props) => {
                props.radius = radius
              }, 500)
            }}
          />

          <ToolbarItemDropdown
            label="Border Color"
            options={TEXT_COLORS}
            value={data.borderColor as string}
            onChange={(borderColor) => {
              setProp((props) => {
                props.borderColor = borderColor
              }, 500)
            }}
            trigger={(value, label) => (
              <Button variant="outline" size={"sm"} className="w-full">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full border" style={{ background: value }} />
                  <span>{label}</span>
                </div>
              </Button>

            )}
            optionChildren={({ option, name }) => (
              <div className="flex items-center gap-2">
                <div
                  className="size-5 rounded-sm border border-background-border font-medium"
                  style={{ backgroundColor: option }}
                />
                <span>{name}</span>
              </div>
            )}
          />

          <ToolbarItemDropdown
            label="Background"
            options={BACKGROUND_COLORS}
            value={data.backgroundColor as string}
            onChange={(backgroundColor) => {
              setProp((props) => {
                props.backgroundColor = backgroundColor
              }, 500)
            }}
            trigger={(value, label) => (
              <Button variant="outline" size={"sm"} className="w-full">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full border" style={{ background: value }} />
                  <span>{label}</span>
                </div>
              </Button>
            )}
            optionChildren={({ option, name }) => (
              <div className="flex items-center gap-2">
                <div
                  className="size-5 rounded-sm border border-background-border font-medium"
                  style={{ backgroundColor: option }}
                />
                <span>{name}</span>
              </div>
            )}
          />
        </ToolbarSection>
      )}

      {isRootNode && (
        <ToolbarSection
          title="Appearance"
          props={["backgroundColor"]}
          summary={({ backgroundColor }) => {
            return (
              <div className="flex items-center gap-2">
                <div
                  className="px-2 py-1 font-medium"
                  style={{
                    backgroundColor: backgroundColor as string,
                  }}
                >
                  A
                </div>
              </div>
            )
          }}
        >
          <ToolbarItemDropdown
            label="Background"
            options={BACKGROUND_COLORS}
            value={data.backgroundColor as string}
            onChange={(backgroundColor) => {
              setProp((props) => {
                props.backgroundColor = backgroundColor
              }, 500)
            }}
            trigger={(value, label) => (
              <Button variant="outline" size={"sm"} className="w-full">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full border" style={{ background: value }} />
                  <span>{label}</span>
                </div>
              </Button>
            )}
            optionChildren={({ option, name }) => (
              <div className="flex items-center gap-2">
                <div
                  className="size-5 rounded-sm border border-background-border font-medium"
                  style={{ backgroundColor: option }}
                />
                <span>{name}</span>
              </div>
            )}
          />
        </ToolbarSection>
      )}

      <ToolbarSection
        title="Alignment"
        props={["justifyContent", "flexDirection", "alignItems", "fillSpace", "gap"]}
      >
        <ToolbarItemSlider
          label="Gap"
          max={120}
          min={0}
          value={(data.gap as number) ?? 0}
          onChange={(gap) => {
            setProp((props) => {
              props.gap = gap
            }, 500)
          }}
        />

        <div className="flex w-full items-center space-x-2">
          <ToolbarItemRadio
            label="Flex Direction"
            options={[
              { value: "row", label: "Row" },
              { value: "column", label: "Column" },
            ]}
            value={data.flexDirection as string}
            onChange={(value) => {
              setProp((props) => {
                props.flexDirection = value as React.CSSProperties["flexDirection"]
              }, 500)
            }}
          />

          <ToolbarItemRadio
            label="Fill Space"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={data.fillSpace ? "yes" : "no"}
            onChange={(value) => {
              setProp((props) => {
                props.fillSpace = value === "yes"
              }, 500)
            }}
          />
        </div>

        <div className="flex w-full items-center space-x-2">
          <ToolbarItemRadio
            label="Align Items"
            options={[
              { value: "flex-start", label: "Flex-start" },
              { value: "center", label: "Center" },
              { value: "flex-end", label: "Flex-end" },
            ]}
            value={data.alignItems as string}
            onChange={(value) => {
              setProp((props) => {
                props.alignItems = value as React.CSSProperties["alignItems"]
              }, 500)
            }}
          />

          <ToolbarItemRadio
            label="Justify Content"
            options={[
              { value: "flex-start", label: "Flex-start" },
              { value: "center", label: "Center" },
              { value: "flex-end", label: "Flex-end" },
            ]}
            value={data.justifyContent as string}
            onChange={(value) => {
              setProp((props) => {
                props.justifyContent = value as React.CSSProperties["justifyContent"]
              }, 500)
            }}
          />
        </div>
      </ToolbarSection>
    </Fragment>
  )
}
