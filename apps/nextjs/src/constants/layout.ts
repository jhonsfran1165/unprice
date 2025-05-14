import { BASE_URL } from "@unprice/config"
import type { SiteConfig } from "../types"

export const navItems = [
  {
    href: `${BASE_URL}/manifesto`,
    title: "Manifesto",
  },
  {
    href: `${BASE_URL}/docs`,
    title: "Docs",
  },
] satisfies { href: string; title: string }[]

export const siteConfig: SiteConfig = {
  name: "Unprice",
  description: "Adaptive monetization infrastructure. Fair prices for everyone.",
  links: {
    twitter: "https://github.com/jhonsfran1165/unprice",
    github: "https://github.com/jhonsfran1165/unprice",
    dashboard: "/",
  },
}
