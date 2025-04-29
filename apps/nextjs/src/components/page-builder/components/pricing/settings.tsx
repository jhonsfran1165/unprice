import { useNode } from "@craftjs/core"
import { Button } from "@unprice/ui/button"
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

  const { data: planVersions, isLoading } = api.planVersions.listByActiveProject.useQuery({
    onlyPublished: true,
    onlyLatest: true,
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
        {!data.plans ||
          (data.plans.length === 0 && (
            <ToolbarItemDropdown
              label="Plan"
              isLoading={isLoading}
              options={options ?? []}
              value={""}
              onChange={(planId) => {
                setProp((props) => {
                  const plan = findPlan(planId)
                  if (plan) {
                    props.plans[0] = plan
                  }
                }, 500)
              }}
            />
          ))}

        {data.plans && data.plans.length > 0 && (
          <ToolbarItemArray
            maxItems={3}
            data={data.plans}
            onChange={(plans) => {
              setProp((props) => {
                props.plans = plans
              }, 500)
            }}
          >
            {({ value, index }) => {
              if (!value) {
                return null
              }

              return (
                <Fragment>
                  <ToolbarItemDropdown
                    label="Plan"
                    isLoading={isLoading}
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
                    trigger={() => (
                      <Button variant="outline" size={"sm"} className="w-full">
                        <div className="flex items-center gap-2">
                          <span>{`${value.title} - ${value.version}`}</span>
                        </div>
                      </Button>
                    )}
                  />
                </Fragment>
              )
            }}
          </ToolbarItemArray>
        )}
      </ToolbarSection>
    </Fragment>
  )
}
