import type { RouterOutputs } from "@builderai/api"

export interface PricingComponentProps {
  plans: RouterOutputs["planVersions"]["getById"]["planVersion"][]
  children?: React.ReactNode
}
