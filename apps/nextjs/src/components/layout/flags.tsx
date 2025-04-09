"use client"

import { FlagValues } from "flags/react"
import { useAtom } from "jotai"
import { useHydrateAtoms } from "jotai/utils"
import { useEffect } from "react"
import { flagsAtom } from "~/hooks/use-flags"

export default function Flags({
  customerEntitlements,
  isMain,
}: {
  customerEntitlements: {
    [x: string]: boolean
  }[]
  isMain: boolean
}): React.ReactNode {
  useHydrateAtoms([
    [
      flagsAtom,
      {
        entitlements: customerEntitlements,
        isMain,
      },
    ],
  ])

  const [_, setData] = useAtom(flagsAtom)

  useEffect(() => {
    setData({
      entitlements: customerEntitlements,
      isMain,
    })
  }, [isMain, customerEntitlements.length])

  return <FlagValues values={customerEntitlements} />
}
