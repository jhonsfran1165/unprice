import { observable } from "@legendapp/state"
import { enableReactUse } from "@legendapp/state/config/enableReactUse"
import { useMount } from "@legendapp/state/react"

enableReactUse()

const canRender = observable(false)

export function useCanRender(): boolean {
  useMount(() => {
    canRender.set(true)
  })
  return canRender.use()
}
