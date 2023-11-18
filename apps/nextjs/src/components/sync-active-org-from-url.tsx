"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"

import { useOrganizationList } from "@builderai/auth"

/**
 * I couldn't find a way to do this on the server :thinking: Clerk is adding support for this soon.
 * If I go to /[workspaceSlug]/**, I want to set the active organization to the workspaceSlug,
 * If it's a personal workspace, set the organization to null, else find the organization by id
 * and set it to that.
 */
export function SyncActiveOrgFromUrl() {
  const params = useParams()

  const workspaceSlug = params.workspaceSlug as string
  const { setActive, userMemberships, isLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  })

  useEffect(() => {
    if (!isLoaded) return

    const org = userMemberships.data?.find(
      ({ organization }) => organization.slug === workspaceSlug
    )

    if (org) {
      void setActive(org)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, isLoaded])

  return null
}
