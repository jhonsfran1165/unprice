import type { RouterOutputs } from "@unprice/trpc"

export interface PricingComponentProps {
  plans: RouterOutputs["planVersions"]["getById"]["planVersion"][]
  children?: React.ReactNode
}
