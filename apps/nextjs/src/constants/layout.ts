import type { SiteConfig } from "../types"

export const navItems = [
  {
    href: "/",
    title: "Dashboard",
  },
  {
    href: "/pricing",
    title: "Pricing",
  },
  {
    href: "/",
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

export const ORGANIZATION_TYPES = {
  STARTUP: {
    description: "",
  },
  PERSONAL: {
    description: "",
  },
  BUSSINESS: {
    description: "",
  },
  OTHER: {
    description: "",
  },
}

export const ORGANIZATION_ROLES = {
  MEMBER: {
    description: "Can view and make changes on pages. No chnages allowed on the organizaiton",
  },
  OWNER: {
    description: "Admin-level access to all resources.",
  },
} as const
