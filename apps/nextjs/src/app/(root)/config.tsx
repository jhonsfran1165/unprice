import {
  ClerkWide,
  Component,
  CreditCard,
  Drizzle,
  Globe,
  Mdx,
  Nextjs,
  React,
  TRPC,
} from "@builderai/ui/icons"

export const marketingFeatures = [
  {
    icon: <Component className="h-10 w-10" />,
    title: "UI Package",
    body: (
      <>
        A UI package with all the components you need for your next application.
        Built by the wonderful{" "}
        <a
          href="https://ui.shadcn.com"
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-4"
        >
          Shadcn
        </a>
        .
      </>
    ),
  },
  {
    icon: <ClerkWide className="h-10" />,
    title: "Authentication",
    body: (
      <>
        Protect pages and API routes throughout your entire app using{" "}
        <a
          href="https://clerk.com"
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-4"
        >
          Clerk
        </a>
        .
      </>
    ),
  },
  {
    icon: <Mdx className="h-10" />,
    title: "MDX",
    body: (
      <>
        Preconfigured MDX as Server Components. MDX is the best way to write
        contentful pages.
      </>
    ),
  },
  {
    icon: (
      <div className="flex gap-3 self-start">
        <Nextjs className="h-10 w-10" />
        <React className="h-10 w-10" />
      </div>
    ),
    title: "Next.js 13 & React 18",
    body: (
      <>
        Latest features from Next 13 using the brand new App Router with full
        React 18 support including streaming.
      </>
    ),
  },

  {
    icon: (
      <div className="flex gap-3 self-start">
        <TRPC className="h-10 w-10" />
        <Drizzle className="h-10 w-10" />
        <Drizzle className="h-10 w-10" />
      </div>
    ),
    title: "Full-stack Typesafety",
    body: (
      <>
        Full-stack Typesafety with{" "}
        <a
          href="https://trpc.io"
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-4"
        >
          tRPC
        </a>
        . Typesafe database querying using{" "}
        <a
          href="https://kysely.dev"
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-4"
        >
          Kysely
        </a>{" "}
        and{" "}
        <a
          href="https://drizzle.io"
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-4"
        >
          drizzle
        </a>
        .
      </>
    ),
  },
  {
    icon: <Globe className="h-10 w-10" />,
    title: "Edge Compute",
    body: (
      <>
        Ready to deploy on Edge functions to ensure a blazingly fast application
        with optimal UX.
      </>
    ),
  },
  {
    icon: <CreditCard className="h-10 w-10" />,
    title: "Payments",
    body: (
      <>
        Accept payments with{" "}
        <a
          href="https://stripe.com"
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-4"
        >
          Stripe
        </a>
        .
      </>
    ),
  },
]
