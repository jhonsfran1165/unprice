import { useNode } from "@craftjs/core"
import { Fragment } from "react"
import { ToolbarSection } from "../../toolbar"
import { ToolbarItemArray } from "../../toolbar/ToolbarItemArray"
import { ToolbarItemRadio } from "../../toolbar/ToolbarItemRadio"
import { ToolbarItemText } from "../../toolbar/ToolbarItemText"
import type { HeaderComponentProps } from "./types"

export const HeaderSettings = () => {
  const { actions, data } = useNode((node) => ({
    data: node.data.props as HeaderComponentProps,
  }))

  const setProp = actions.setProp as (
    cb: (props: HeaderComponentProps) => void,
    throttleRate?: number
  ) => void

  return (
    <Fragment>
      <ToolbarSection title="Links" props={["showThemeToggle"]}>
        <div className="flex w-full items-center space-x-2">
          <ToolbarItemRadio
            label="Theme toggle?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={data.showThemeToggle ? "yes" : "no"}
            onChange={(value) => {
              setProp((props) => {
                props.showThemeToggle = value === "yes"
              }, 500)
            }}
          />

          <ToolbarItemRadio
            label="Links?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={data.showLinks ? "yes" : "no"}
            onChange={(value) => {
              setProp((props) => {
                props.showLinks = value === "yes"
              }, 500)
            }}
          />
        </div>

        {data.showLinks && (
          <ToolbarItemArray
            data={data.links ?? []}
            onChange={(value) => {
              setProp((props) => {
                props.links = value
              }, 500)
            }}
          >
            {({ value, index }) => (
              <Fragment>
                <ToolbarItemText
                  value={value.href}
                  label={index === 0 ? "href" : undefined}
                  onChange={(href) => {
                    setProp((props) => {
                      props.links![index]!.href = href
                    }, 500)
                  }}
                />
                <ToolbarItemText
                  value={value.title}
                  label={index === 0 ? "title" : undefined}
                  onChange={(title) => {
                    setProp((props) => {
                      props.links![index]!.title = title
                    }, 500)
                  }}
                />
              </Fragment>
            )}
          </ToolbarItemArray>
        )}
      </ToolbarSection>
    </Fragment>
  )
}
