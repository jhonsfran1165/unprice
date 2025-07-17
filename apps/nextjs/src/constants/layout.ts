import { BASE_URL, DOCS_DOMAIN, PRICING_DOMAIN } from "@unprice/config"
import type { SiteConfig } from "../types"

export const navItems = [
  {
    href: `${BASE_URL}/manifesto`,
    title: "Manifesto",
  },
  {
    href: `${DOCS_DOMAIN}/docs`,
    title: "Docs",
  },
  {
    href: `${PRICING_DOMAIN}/`,
    title: "Pricing",
  },
] satisfies { href: string; title: string }[]

export const siteConfig: SiteConfig = {
  name: "Unprice",
  description: "Adaptive monetization infrastructure. Better pricing for SaaS.",
  links: {
    twitter: "https://github.com/jhonsfran1165/unprice",
    github: "https://github.com/jhonsfran1165/unprice",
    dashboard: "/",
  },
}
