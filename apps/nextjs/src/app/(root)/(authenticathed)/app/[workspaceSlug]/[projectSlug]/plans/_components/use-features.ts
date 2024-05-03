import { atom, useAtom } from "jotai"

import type { PlanVersionFeature } from "@builderai/db/validators"

const configActiveFeatureAtom = atom<PlanVersionFeature | null>(null)

export function useActiveFeature() {
  return useAtom(configActiveFeatureAtom)
}

export interface PlanFeaturesList {
  planFeatures: PlanVersionFeature[]
}

export const configPlanFeaturesListAtom = atom<PlanFeaturesList>({
  planFeatures: [],
})

const configPlanActiveTabAtom = atom<"planFeatures">("planFeatures")

export function usePlanActiveTab() {
  return useAtom(configPlanActiveTabAtom)
}

// const derivedAtom = atom<
//   PlanFeaturesList,
//   [SetStateAction<PlanFeaturesList>],
//   void
// >(
//   (get) => get(configPlanFeaturesListAtom),
//   (get, set, data) => {
//     set(configPlanFeaturesListAtom, data)

//     const planFeatures = get(configPlanFeaturesListAtom)

//     console.log("Setting data", planFeatures)
//   }
// )

export function usePlanFeaturesList() {
  // const data = useAtomValue(configPlanFeaturesListAtom)
  // use useMemo to avoid re-rendering
  // const updateVersion = api.planVersions.update.useMutation({})

  // configPlanFeaturesListAtom.read = (get) => {
  //   return get(configPlanFeaturesListAtom)
  // }

  // configPlanFeaturesListAtom.write = (get, set, data) => {
  //   set(configPlanFeaturesListAtom, data)

  //   const planFeatures = get(configPlanFeaturesListAtom)

  //   // void updateVersion.mutateAsync({
  //   //   id: "pv_qdWpnSCM7emEkxUx",
  //   //   featuresConfig: planFeatures.planFeatures,
  //   //   status: "published",
  //   // })

  //   console.log("Setting data", planFeatures)
  // }

  return useAtom(configPlanFeaturesListAtom)
}

export function usePlanFeaturesListActive() {
  const [featuresList] = usePlanFeaturesList()
  const [planActiveTab] = usePlanActiveTab()

  return featuresList[planActiveTab] || []
}
