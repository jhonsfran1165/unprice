import { Component, CreditCard, Globe, Mdx, NextAuth, Nextjs, React, TRPC } from "@unprice/ui/icons"

export const marketingFeatures = [
  {
    icon: <Component className="h-10 w-10" />,
    title: "Feature & plans",
    body: (
      <>
        Create feature-rich plans with multiple versions. Manage your features and plans with ease.
        Every feature can have multiple versions so you can easily manage changes. Implement once
        and use everywhere. Use the same feature flag in your application and API. Forget hardcoding
        plans in your application.
      </>
    ),
  },
  {
    icon: <Component className="h-10 w-10" />,
    title: "Report usage and verify",
    body: (
      <>
        Once you create a feature, you can start tracking its usage. You can see how many times a
        feature was used and by whom. You can also verify if a feature is being used correctly,
        apply limits and more.
      </>
    ),
  },
  {
    icon: <Component className="h-10 w-10" />,
    title: "Billing & payments",
    body: (
      <>
        We architected unprice to be vendor agnostic. You can use any payment provider you want. For
        now we support Stripe, but we are working on adding more providers. Send invoices, manage
        subscriptions and more.
      </>
    ),
  },
  {
    icon: <Component className="h-10 w-10" />,
    title: "Customer & Subscriptions",
    body: (
      <>
        Create and manage customers and subscriptions. You can create customers, add subscriptions,
        manage their billing and more. You can also create and manage subscriptions for your
        customers. We take care of the hard stuff so you can focus on your business.
      </>
    ),
  },
  {
    icon: <Component className="h-10 w-10" />,
    title: "Pricing pages",
    body: (
      <>
        Create beautiful pricing pages with ease. We provide you with a simple and easy-to-use
        editor to create your pricing page. You can customize the colors, fonts, and more. You can
        also add your own custom CSS.
      </>
    ),
  },
  {
    icon: <Component className="h-10 w-10" />,
    title: "API first & SDK",
    body: (
      <>
        Unprice is API first. You can use our API to create and manage your features, plans,
        customers, and more. We also provide you with an SDK to make it easier to integrate with
        your application.
      </>
    ),
  },
]

export const techStack = [
  {
    icon: <Component className="h-10 w-10" />,
    title: "UI Package",
    body: (
      <>
        A UI package with all the components you need for your next application. Built by the
        wonderful{" "}
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
    icon: <NextAuth className="h-10" />,
    title: "Authentication",
    body: (
      <>
        Protect pages and API routes throughout your entire app using{" "}
        <a
          href="https://authjs.dev/"
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-4"
        >
          Next Auth
        </a>
        .
      </>
    ),
  },
  {
    icon: <Mdx className="h-10" />,
    title: "MDX",
    body: (
      <>Preconfigured MDX as Server Components. MDX is the best way to write contentful pages.</>
    ),
  },
  {
    icon: (
      <div className="flex gap-3 self-start">
        <Nextjs className="h-10 w-10" />
        <React className="h-10 w-10" />
      </div>
    ),
    title: "Next.js 14 & React 18",
    body: (
      <>
        Latest features from Next 14 using the brand new App Router with full React 18 support
        including streaming.
      </>
    ),
  },

  {
    icon: (
      <div className="flex gap-3 self-start">
        <TRPC className="h-10 w-10" />
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
        . Typesafe database querying using and{" "}
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
      <>Ready to deploy on Edge functions to ensure a blazingly fast application with optimal UX.</>
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
