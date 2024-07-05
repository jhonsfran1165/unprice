import { ToolbarItem, ToolbarSection } from "../../toolbar"
import type { ContainerProps } from "./container"

export const ContainerSettings = () => {
  return (
    <ToolbarSection
      title="Container Settings"
      props={["padding", "margin"]}
      summary={(props: ContainerProps) => {
        return `${props.margin || ""}, ${props.padding || ""}`
      }}
    >
      <ToolbarItem full={true} propKey="margin" type="slider" label="Margin" />
      <ToolbarItem full={true} propKey="padding" type="slider" label="Padding" />
    </ToolbarSection>
  )
}
