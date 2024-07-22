import { useNode } from "@craftjs/core"
import { Button } from "@unprice/ui/button"
import { Fragment } from "react"
import { BACKGROUND_COLORS, TEXT_COLORS, weightDescription } from "~/lib/theme"
import {
  ToolbarItemDropdown,
  ToolbarItemRadio,
  ToolbarItemSlider,
  ToolbarSection,
} from "../../toolbar"
import type { TextComponentProps } from "./types"

export const TextSettings = () => {
  const { actions, data } = useNode((node) => ({
    data: node.data.props as TextComponentProps,
  }))

  const setProp = actions.setProp as (
    cb: (props: TextComponentProps) => void,
    throttleRate?: number
  ) => void

  return (
    <Fragment>
      <ToolbarSection
        title="Typography"
        props={["fontSize", "fontWeight", "textAlign"]}
        summary={({ fontSize, fontWeight, textAlign }) => {
          return `${fontSize}px, ${weightDescription(fontWeight as number)}, ${textAlign}`
        }}
      >
        <ToolbarItemSlider
          label="Font Size"
          max={120}
          min={5}
          value={(data.fontSize as number) ?? 0}
          onChange={(fontSize) => {
            setProp((props) => {
              props.fontSize = fontSize
            }, 500)
          }}
        />

        <div className="flex w-full items-center space-x-2">
          <ToolbarItemRadio
            label="Text Align"
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
            value={data.textAlign as string}
            onChange={(value) => {
              setProp((props) => {
                props.textAlign = value as React.CSSProperties["textAlign"]
              }, 500)
            }}
          />

          <ToolbarItemRadio
            label="Font Weight"
            options={[
              { value: "400", label: "Regular" },
              { value: "500", label: "Medium" },
              { value: "700", label: "Bold" },
            ]}
            value={data.fontWeight as string}
            onChange={(value) => {
              setProp((props) => {
                props.fontWeight = value
              }, 500)
            }}
          />
        </div>
      </ToolbarSection>

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
        props={["color", "backgroundColor", "shadow"]}
        summary={({ color, backgroundColor, shadow }) => {
          return (
            <div className="flex items-center gap-2">
              <div
                className="rounded-sm border border-background-border px-2 py-1 font-medium"
                style={{
                  color: color as string,
                  backgroundColor: backgroundColor as string,
                  textShadow: `0px 0px 2px rgba(0,0,0,${((shadow as number) || 0) / 100})`,
                }}
              >
                A
              </div>
            </div>
          )
        }}
      >
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
        <ToolbarItemDropdown
          label="Color"
          options={TEXT_COLORS}
          value={data.color as string}
          onChange={(color) => {
            setProp((props) => {
              props.color = color
            }, 500)
          }}
          trigger={(value, label) => (
            <Button variant="outline" size={"sm"} className="w-full">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full border" style={{ backgroundColor: value }} />
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
    </Fragment>
  )
}
