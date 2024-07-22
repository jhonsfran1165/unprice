import type { RouterOutputs } from "@unprice/api"

export interface PricingComponentProps {
  plans: RouterOutputs["planVersions"]["getById"]["planVersion"][]
  children?: React.ReactNode
}
