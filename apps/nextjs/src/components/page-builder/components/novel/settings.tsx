import { Fragment } from "react"
import { TEXT_COLORS } from "~/lib/theme"
import { ToolbarItem, ToolbarSection } from "../../toolbar"

export const NovelEditorSettings = () => {
  return (
    <Fragment>
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
        props={["shadow", "radius", "border", "borderColor"]}
        summary={({ shadow, radius, border, borderColor }) => {
          return (
            <div className="flex items-center gap-2">
              <div
                className="px-2 py-1 font-medium"
                style={{
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
        <ToolbarItem size="sm" propKey="shadow" type="slider" label="Shadow" max={20} min={0} />
        <ToolbarItem size="sm" propKey="radius" type="slider" label="Radius" max={100} min={0} />

        <ToolbarItem
          propKey="borderColor"
          size="sm"
          type="select"
          label="Border Color"
          options={TEXT_COLORS}
        />
      </ToolbarSection>
    </Fragment>
  )
}
