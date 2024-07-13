import { Label } from "@builderai/ui/label"
import { RadioGroupItem } from "@builderai/ui/radio-group"
import { useNode } from "@craftjs/core"
import { Fragment } from "react"
import { ToolbarItem, ToolbarSection } from "../../toolbar"
import { ToolbarItemArray } from "../../toolbar/ToolbarItemArray"
import { ToolbarItemText } from "../../toolbar/ToolbarItemText"

export const HeaderSettings = () => {

  const {
    actions: { setProp },
    data,
  } = useNode((node) => ({
    data: node.data.props as {
      links?: { text: string; href: string }[]
      showThemeToggle?: string
      children?: React.ReactNode
    }
  }))


  return (
    <Fragment>
      <ToolbarSection title="Links" props={["showThemeToggle"]}>
        <ToolbarItem propKey="showThemeToggle" size="sm" type="radio" label="Theme toggle?">
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

        <ToolbarItemArray data={data.links ?? []} size="sm" label="Links" onChange={(value) => {
          setProp((props: {
            links?: { text: string; href: string }[]
            showThemeToggle?: string
          }) => {
            props.links = value
          }, 500)
        }
        }>
          {({ value, index }) => (
            <Fragment>
              <ToolbarItemText size={"sm"} value={value.href} label="href" onChange={
                (value) => {
                  setProp((props: {
                    links: { text: string; href: string }[]
                    showThemeToggle?: string
                  }) => {
                    if (props.links[index]) {
                      props.links[index].href = value;
                    }
                  }, 500)
                }

              } />
              <ToolbarItemText size={"sm"} value={value.text} label="text" onChange={
                (value) => {
                  setProp((props: {
                    links: { text: string; href: string }[]
                    showThemeToggle?: string
                  }) => {
                    if (props.links[index]) {
                      props.links[index].text = value;
                    }
                  }, 500)
                }

              } />
            </Fragment>
          )}
        </ToolbarItemArray>
      </ToolbarSection>
    </Fragment>
  )
}
