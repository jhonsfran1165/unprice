"use server"

import { db } from "@unprice/db"
import { unstable_cache } from "next/cache"

export async function getPageData(domain: string) {
  const getCachedPage = unstable_cache(
    async () => {
      const page = await db.query.pages.findFirst({
        where: (page, { eq, or }) => or(eq(page.customDomain, domain), eq(page.subdomain, domain)),
        with: {
          project: true,
        },
      })

      if (!page?.id) return null

      return page
    },
    [domain],
    { tags: [`${domain}:page-data`] }
  )

  return getCachedPage()
}
