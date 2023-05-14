import { LayoutConfig } from "@/lib/types"

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

export enum OrganizationTypes {
  STARTUP = "STARTUP",
  PERSONAL = "PERSONAL",
  BUSSINESS = "BUSSINESS",
}
