"use client"

import { useSession } from "@builderai/auth/react"

export const Client = () => {
  const session = useSession()

  return <div>{JSON.stringify(session)}</div>
}
