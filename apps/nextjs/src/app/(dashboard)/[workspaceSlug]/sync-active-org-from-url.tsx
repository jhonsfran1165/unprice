"use client"

import { useParams, useRouter } from "next/navigation"
import * as React from "react"

import { useOrganizationList } from "@builderai/auth"

/**
 * I couldn't find a way to do this on the server :thinking: Clerk is adding support for this soon.
 * If I go to /[workspaceSlug]/**, I want to set the active organization to the workspaceSlug,
 * If it's a personal workspace, set the organization to null, else find the organization by id
 * and set it to that.
 */
export function SyncActiveOrgFromUrl() {
  const { workspaceSlug } = useParams() as { workspaceSlug: string }
  const { setActive, organizationList, isLoaded } = useOrganizationList()

  const router = useRouter()

  React.useEffect(() => {
    if (!isLoaded) return

    const org = organizationList?.find(
      ({ organization }) => organization.slug === workspaceSlug
    )

    if (org) {
      void setActive(org)
    } else {
      void setActive({ organization: null })
    }

    router.push(`/${workspaceSlug}`)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, isLoaded])

  return null
}
