import { Label } from "@builderai/ui/label"
import { RadioGroupItem } from "@builderai/ui/radio-group"
import { Fragment } from "react"
import { BACKGROUND_COLORS, TEXT_COLORS } from "~/lib/theme"
import { ToolbarItem, ToolbarSection } from "../../toolbar"

export const ContainerSettings = () => {
  return (
    <Fragment>
      <ToolbarSection
        title="Dimensions"
        props={["width", "height"]}
        summary={({ width, height }) => {
          return `${width} x ${height}`
        }}
      >
        <div className="flex items-center space-x-2 w-full">
          <ToolbarItem propKey="width" type="text" size={"sm"} label="Width" />
          <ToolbarItem propKey="height" type="text" size={"sm"} label="Height" />
        </div>
      </ToolbarSection>
      <ToolbarSection
        title="Margin"
        props={["marginLeft", "marginRight", "marginTop", "marginBottom"]}
        summary={({ marginLeft, marginRight, marginTop, marginBottom }) => {
          return `${marginLeft}px, ${marginRight}px, ${marginTop}px, ${marginBottom}px`
        }}
      >
        <div className="flex items-center space-x-2 w-full">
          <div className="flex flex-col w-1/2">
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

          <div className="flex flex-col w-1/2">
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
        <div className="flex items-center space-x-2 w-full">
          <div className="flex flex-col w-1/2">
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

          <div className="flex flex-col w-1/2">
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
        props={["color", "backgroundColor", "shadow", "radius", "border", "borderColor"]}
        summary={({ color, backgroundColor, shadow, radius, border, borderColor }) => {
          return (
            <div className="flex items-center gap-2">
              <div
                className="px-2 py-1 font-medium"
                style={{
                  color: color as string,
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
        <ToolbarItem size="sm" propKey="border" type="slider" label="Border" max={5} min={0} />
        <ToolbarItem size="sm" propKey="shadow" type="slider" label="Shadow" max={100} min={0} />
        <ToolbarItem size="sm" propKey="radius" type="slider" label="Radius" max={100} min={0} />

        <ToolbarItem propKey="borderColor" size="sm" type="select" label="Border Color" options={TEXT_COLORS} />
        <ToolbarItem propKey="color" size="sm" type="select" label="Color" options={TEXT_COLORS} />
        <ToolbarItem
          propKey="backgroundColor"
          size="sm"
          type="select"
          label="Background"
          options={BACKGROUND_COLORS}
        />
      </ToolbarSection>



      <ToolbarSection
        title="Alignment"
        props={["justifyContent", "flexDirection", "alignItems", "fillSpace", "gap"]}
      >
        <ToolbarItem
          size="sm"
          propKey="gap"
          type="slider"
          label="Gap"
          max={100}
          min={0}
        />
        <div className="flex items-center space-x-2 w-full">
          <ToolbarItem propKey="flexDirection" size="sm" type="radio" label="Flex Direction">
            <div className="flex items-center space-x-2">
              <RadioGroupItem size="sm" value="row" id="row" />
              <Label htmlFor="row" className="text-xs font-normal">
                Row
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem size="sm" value="column" id="column" />
              <Label htmlFor="column" className="text-xs font-normal">
                Column
              </Label>
            </div>
          </ToolbarItem>
          <ToolbarItem propKey="fillSpace" size="sm" type="radio" label="Fill Space">
            <div className="flex items-center space-x-2">
              <RadioGroupItem size="sm" value="yes" id="yes" />
              <Label htmlFor="yes" className="text-xs font-normal">
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem size="sm" value="no" id="no" />
              <Label htmlFor="no" className="text-xs font-normal">
                No
              </Label>
            </div>
          </ToolbarItem>
        </div>
        <div className="flex items-center space-x-2 w-full">
          <ToolbarItem propKey="alignItems" size="sm" type="radio" label="Align Items">
            <div className="flex items-center space-x-2">
              <RadioGroupItem size="sm" value="flex-start" id="flex-start" />
              <Label htmlFor="flex-start" className="text-xs font-normal">
                Flex-start
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem size="sm" value="center" id="center" />
              <Label htmlFor="center" className="text-xs font-normal">
                Center
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem size="sm" value="flex-end" id="flex-end" />
              <Label htmlFor="flex-end" className="text-xs font-normal">
                Flex-end
              </Label>
            </div>
          </ToolbarItem>
          <ToolbarItem propKey="justifyContent" size="sm" type="radio" label="Justify Content">
            <div className="flex items-center space-x-2">
              <RadioGroupItem size="sm" value="flex-start" id="flex-start" />
              <Label htmlFor="flex-start" className="text-xs font-normal">
                Flex-start
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem size="sm" value="center" id="center" />
              <Label htmlFor="center" className="text-xs font-normal">
                Center
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem size="sm" value="flex-end" id="flex-end" />
              <Label htmlFor="flex-end" className="text-xs font-normal">
                Flex-end
              </Label>
            </div>
          </ToolbarItem>
        </div>
      </ToolbarSection>
    </Fragment >
  )
}
