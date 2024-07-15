import { useNode } from "@craftjs/core"
import { Fragment } from "react"
import { api } from "~/trpc/client"
import { ToolbarItemArray, ToolbarItemDropdown, ToolbarSection } from "../../toolbar"
import type { PricingComponentProps } from "./types"

export const PricingTableSettings = () => {
  const { actions, data } = useNode((node) => ({
    data: node.data.props as PricingComponentProps,
  }))

  const setProp = actions.setProp as (
    cb: (props: PricingComponentProps) => void,
    throttleRate?: number
  ) => void

  const {
    data: planVersions,
    isLoading,
  } = api.planVersions.listByActiveProject.useQuery({
    published: true,
  })

  const findPlan = (id: string) => {
    return planVersions?.planVersions.find((plan) => plan.id === id)
  }

  const options = planVersions?.planVersions.map((plan) => ({
    option: plan.id,
    name: `${plan.title} - ${plan.version}`,
  }))

  return (
    <Fragment>

      <ToolbarSection title="Plans" props={["plans"]}>
        {data.plans && !isLoading && (
          <ToolbarItemArray
            data={data.plans}
            onChange={(plans) => {
              setProp((props) => {
                props.plans = plans
              }, 500)
            }}
          >
            {({ value, index }) => (
              <Fragment>
                <ToolbarItemDropdown
                  label={`${value.title} - ${value.version}`}
                  options={options ?? []}
                  value={value.id}
                  onChange={(planId) => {
                    setProp((props) => {
                      const plan = findPlan(planId)
                      if (plan) {
                        props.plans[index] = plan
                      }
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
