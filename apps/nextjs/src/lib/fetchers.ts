import { SITES_BASE_DOMAIN } from "@unprice/config"
import { db } from "@unprice/db"
import { unstable_cache } from "next/cache"

export async function getPageData(domain: string) {
  const subdomain = domain.endsWith(`.${SITES_BASE_DOMAIN}`)
    ? domain.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, "")
    : domain

  return await unstable_cache(
    async () => {
      const page = await db.query.pages.findFirst({
        where: (page, { eq, or }) =>
          or(eq(page.customDomain, subdomain), eq(page.subdomain, subdomain)),
      })

      if (!page?.id) return null

      return page
    },
    [`${domain}`],
    {
      revalidate: 60 * 60 * 24, // revalidate every 24 hours
      tags: [`${domain}`],
    }
  )()
}
