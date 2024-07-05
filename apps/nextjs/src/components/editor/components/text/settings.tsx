import { Label } from "@builderai/ui/label"
import { RadioGroupItem } from "@builderai/ui/radio-group"
import { ToolbarItem, ToolbarSection } from "../../toolbar"

export const capitalize = (text: string) => text.toUpperCase() + text.substring(1, text.length)
export const weightDescription = (weight: number) =>
  weight === 400 ? "Regular" : weight === 500 ? "Medium" : "Bold"

export const TextSettings = () => {
  return (
    <ToolbarSection
      title="Typography"
      props={["fontSize", "fontWeight", "textAlign"]}
      summary={({ fontSize, fontWeight, textAlign }: any) => {
        return `${fontSize || ""}, ${weightDescription(Number.parseInt(fontWeight))}, ${capitalize(
          textAlign
        )}`
      }}
    >
      <ToolbarItem full={true} propKey="fontSize" type="slider" label="Font Size" />
      <ToolbarItem propKey="textAlign" type="radio" label="Align">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="left" id="left" />
          <Label htmlFor="r1">Left</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="center" id="center" />
          <Label htmlFor="r1">Center</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="right" id="right" />
          <Label htmlFor="r1">Right</Label>
        </div>
      </ToolbarItem>
      <ToolbarItem propKey="fontWeight" type="radio" label="Weight">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="400" id="400" />
          <Label htmlFor="r1">Regular</Label>
        </div>{" "}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="500" id="500" />
          <Label htmlFor="r1">Medium</Label>
        </div>{" "}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="700" id="700" />
          <Label htmlFor="r1">Bold</Label>
        </div>
      </ToolbarItem>
    </ToolbarSection>
  )
}
