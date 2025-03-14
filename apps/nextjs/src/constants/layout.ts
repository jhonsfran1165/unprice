import { BASE_URL } from "@unprice/config"
import type { SiteConfig } from "../types"

export const navItems = [
  {
    href: "/",
    title: "Home",
  },
  {
    href: `${BASE_URL}/pricing`,
    title: "Pricing",
  },
  {
    href: `${BASE_URL}/docs`,
    title: "Docs",
  },
] satisfies { href: string; title: string }[]

// TODO: put the logo here
export const siteConfig: SiteConfig = {
  name: "Unprice",
  description: "Build your software as a service with Unprice",
  mainNav: [
    {
      title: "Feedback",
      href: "/feedback",
    },
  ],
  links: {
    twitter: "https://github.com/jhonsfran1165/unprice",
    github: "https://github.com/jhonsfran1165/unprice",
    dashboard: "/",
  },
}
