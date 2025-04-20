"use client"

import { FlagValues } from "flags/react"
import { useAtom } from "jotai"
import { useHydrateAtoms } from "jotai/utils"
import { useEffect } from "react"
import { flagsAtom } from "~/hooks/use-flags"

export default function Flags({
  customerEntitlements,
  isMain,
  customerId,
}: {
  customerEntitlements: {
    [x: string]: boolean
  }[]
  isMain: boolean
  customerId: string
}): React.ReactNode {
  useHydrateAtoms([
    [
      flagsAtom,
      {
        entitlements: customerEntitlements,
        isMain,
        customerId,
      },
    ],
  ])

  const [_, setData] = useAtom(flagsAtom)

  useEffect(() => {
    setData({
      entitlements: customerEntitlements,
      isMain,
      customerId,
    })
  }, [isMain, customerEntitlements.length])

  return <FlagValues values={customerEntitlements} />
}
