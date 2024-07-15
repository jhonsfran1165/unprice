import { Button } from "@builderai/ui/button"
import { useNode } from "@craftjs/core"
import { Fragment } from "react"
import { TEXT_COLORS } from "~/lib/theme"
import { ToolbarItemDropdown, ToolbarItemSlider, ToolbarSection } from "../../toolbar"
import type { NovelComponentProps } from "./types"

export const NovelEditorSettings = () => {
  const { actions, data } = useNode((node) => ({
    data: node.data.props as NovelComponentProps,
  }))

  const setProp = actions.setProp as (
    cb: (props: NovelComponentProps) => void,
    throttleRate?: number
  ) => void

  return (
    <Fragment>
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
      </ToolbarSection>
    </Fragment>
  )
}
