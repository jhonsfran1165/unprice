import { Label } from "@builderai/ui/label"
import { RadioGroupItem } from "@builderai/ui/radio-group"
import { Fragment } from "react"
import { BACKGROUND_COLORS, TEXT_COLORS, weightDescription } from "~/lib/theme"
import { ToolbarItem, ToolbarSection } from "../../toolbar"

export const TextSettings = () => {
  return (
    <Fragment>
      <ToolbarSection
        title="Typography"
        props={["fontSize", "fontWeight", "textAlign"]}
        summary={({ fontSize, fontWeight, textAlign }) => {
          return `${fontSize}px, ${weightDescription(fontWeight as number)}, ${textAlign}`
        }}
      >
        <ToolbarItem
          size="sm"
          propKey="fontSize"
          type="slider"
          label="Font Size"
          max={120}
          min={5}
        />
        <div className="flex w-full items-center space-x-2">
          <ToolbarItem propKey="textAlign" type="radio" label="Align">
            <div className="flex items-center space-x-2">
              <RadioGroupItem size="sm" value="left" id="left" />
              <Label htmlFor="left" className="font-normal text-xs">
                Left
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem size="sm" value="center" id="center" />
              <Label htmlFor="center" className="font-normal text-xs">
                Center
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem size="sm" value="right" id="right" />
              <Label htmlFor="right" className="font-normal text-xs">
                Right
              </Label>
            </div>
          </ToolbarItem>
          <ToolbarItem propKey="fontWeight" type="radio" label="Weight">
            <div className="flex items-center space-x-2">
              <RadioGroupItem size="sm" value="400" id="400" />
              <Label htmlFor="400" className="font-normal text-xs">
                Regular
              </Label>
            </div>{" "}
            <div className="flex items-center space-x-2">
              <RadioGroupItem size="sm" value="500" id="500" />
              <Label htmlFor="500" className="font-normal text-xs">
                Medium
              </Label>
            </div>{" "}
            <div className="flex items-center space-x-2">
              <RadioGroupItem size="sm" value="700" id="700" />
              <Label htmlFor="700" className="font-normal text-xs">
                Bold
              </Label>
            </div>
          </ToolbarItem>
        </div>
      </ToolbarSection>
      <ToolbarSection
        title="Margin"
        props={["marginLeft", "marginRight", "marginTop", "marginBottom"]}
        summary={({ marginLeft, marginRight, marginTop, marginBottom }) => {
          return `${marginLeft}px, ${marginRight}px, ${marginTop}px, ${marginBottom}px`
        }}
      >
        <div className="flex w-full items-center space-x-2">
          <div className="flex w-1/2 flex-col">
            <ToolbarItem
              propKey="marginLeft"
              size="sm"
              type="slider"
              label="Left"
              max={120}
              min={0}
            />
            <ToolbarItem
              propKey="marginRight"
              size="sm"
              type="slider"
              label="Right"
              max={120}
              min={0}
            />
          </div>

          <div className="flex w-1/2 flex-col">
            <ToolbarItem
              propKey="marginTop"
              size="sm"
              type="slider"
              label="Top"
              max={120}
              min={0}
            />
            <ToolbarItem
              propKey="marginBottom"
              size="sm"
              type="slider"
              label="Bottom"
              max={120}
              min={0}
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
        <div className="flex w-full items-center space-x-2">
          <div className="flex w-1/2 flex-col">
            <ToolbarItem
              propKey="paddingLeft"
              size="sm"
              type="slider"
              label="Left"
              max={120}
              min={0}
            />
            <ToolbarItem
              propKey="paddingRight"
              size="sm"
              type="slider"
              label="Right"
              max={120}
              min={0}
            />
          </div>

          <div className="flex w-1/2 flex-col">
            <ToolbarItem
              propKey="paddingTop"
              size="sm"
              type="slider"
              label="Top"
              max={120}
              min={0}
            />
            <ToolbarItem
              propKey="paddingBottom"
              size="sm"
              type="slider"
              label="Bottom"
              max={120}
              min={0}
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
        <ToolbarItem size="sm" propKey="shadow" type="slider" label="Shadow" max={100} min={0} />
        <ToolbarItem propKey="color" size="sm" type="select" label="Color" options={TEXT_COLORS} />
        <ToolbarItem
          propKey="backgroundColor"
          size="sm"
          type="select"
          label="Background"
          options={BACKGROUND_COLORS}
        />
      </ToolbarSection>
    </Fragment>
  )
}
