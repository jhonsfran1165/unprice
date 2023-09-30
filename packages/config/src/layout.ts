import type { SiteConfig } from "./types"

export const navItems = [
  {
    href: "/dashboard",
    title: "Overview",
  },
  {
    href: "/pricing",
    title: "Pricing",
  },
  {
    href: "/dashboard",
    title: "Products",
  },
  {
    href: "/dashboard",
    title: "Settings",
  },
] satisfies { href: string; title: string }[]

// TODO: put the logo here
export const siteConfig: SiteConfig = {
  name: "Builder AI",
  description: "Build your software as a service with AI tools",
  mainNav: [
    {
      title: "Feedback",
      href: "/feedback",
    },
  ],
  links: {
    twitter: "https://twitter.com/shadcn",
    github: "https://github.com/shadcn/ui",
    dashboard: "/dashboard",
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
    description:
      "Can view and make changes on pages. No chnages allowed on the organizaiton",
  },
  OWNER: {
    description: "Admin-level access to all resources.",
  },
} as const
