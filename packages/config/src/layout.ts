import { LayoutConfig } from "./types";

export const siteConfig = {
  name: "Acme Corp",
  description:
    "Next.js starter kit that includes everything you need to build a modern web application. Mobile application preconfigured, ready to go.",
  github: "https://github.com/juliusmarminge/acme-corp",
  twitter: "https://twitter.com/jullerino",
}

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
export const layoutConfig: LayoutConfig = {
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
