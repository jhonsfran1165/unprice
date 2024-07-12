import { Label } from "@builderai/ui/label"
import { RadioGroupItem } from "@builderai/ui/radio-group"
import { Fragment } from "react"
import { ToolbarItem, ToolbarSection } from "../../toolbar"

export const HeaderSettings = () => {
  return (
    <Fragment>
      <ToolbarSection title="Links" props={["showThemeToggle"]}>
        <ToolbarItem propKey="showThemeToggle" size="sm" type="radio" label="Show theme toggle">
          <div className="flex items-center space-x-2">
            <RadioGroupItem size="sm" value={"yes"} id="yes" />
            <Label htmlFor="yes" className="font-normal text-xs">
              Yes
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem size="sm" value="no" id="no" />
            <Label htmlFor="no" className="font-normal text-xs">
              No
            </Label>
          </div>
        </ToolbarItem>
      </ToolbarSection>
    </Fragment>
  )
}
