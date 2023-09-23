import { SubscriptionPlan } from "@/lib/types"

// TODO: set stripe prices
export const SUBSCRIPTIONS: SubscriptionPlan[] = [
  {
    plan: "FREE",
    tagline: "For startups & side projects",
    clicksLimit: "Up to 1K link clicks/mo",
    copy: "Ideal for testing and creating pages",
    features: [
      {
        text: "Free custom domains",
        footnote:
          "Just bring any domain you own and turn it into a custom domain link shortener for free.",
      },
      { text: "Unlimited branded links" },
      { text: "5 projects" },
      { text: "Password-protected links" },
      { text: "Custom Social Previews", footnote: "asdasd" },
      {
        text: "Root domain redirect",
        footnote:
          "Redirect vistors that land on the root of your domain (e.g. yourdomain.com) to a page of your choice.",
        negative: true,
      },
      { text: "SSO/SAML", negative: true },
    ],
    cta: "Start for free",
    ctaLink: "https://app.builder.sh/register",
    limits: {
      views: 10000,
      organizations: 2,
      projects: 2,
      users: 2,
    },
    price: {
      monthly: {
        amount: 9,
        currency: "USD",
        priceIds: {
          test: "price_1MBbPRD66VcNFN5v3Hdoxmu8",
          production: "price_1MBbPRD66VcNFN5v3Hdoxmu8",
        },
      },
      yearly: {
        amount: 90,
        currency: "USD",
        priceIds: {
          test: "price_1MBbPRD66VcNFN5v3Hdoxmu8",
          production: "price_1MBbPRD66VcNFN5v3Hdoxmu8",
        },
      },
    },
  },
  {
    plan: "PRO",
    tagline: "For larger teams with increased usage",
    clicksLimit: "Up to 1K link clicks/mo",
    copy: "The best way to start creating driven data pages for whatever you want to use",
    features: [
      {
        text: "Free custom domains",
        footnote:
          "Just bring any domain you own and turn it into a custom domain link shortener for free.",
      },
      { text: "Unlimited branded links" },
      { text: "Unlimited projects" },
      { text: "Password-protected links" },
      { text: "Custom Social Previews", footnote: "todo: use photo" },
      {
        text: "Root domain redirect",
        footnote:
          "Redirect vistors that land on the root of your domain (e.g. yourdomain.com) to a page of your choice.",
      },
      { text: "SSO/SAML", negative: true },
    ],
    cta: "Get started",
    ctaLink: "https://app.builder.sh/register",
    limits: {
      views: 10000,
      organizations: 2,
      projects: 2,
      users: 2,
    },
    price: {
      monthly: {
        amount: 9,
        currency: "USD",
        priceIds: {
          test: "price_1MBbPRD66VcNFN5v3Hdoxmu8",
          production: "price_1MBbPRD66VcNFN5v3Hdoxmu8",
        },
      },
      yearly: {
        amount: 90,
        currency: "USD",
        priceIds: {
          test: "price_1MBbPRD66VcNFN5v3Hdoxmu8",
          production: "price_1MBbPRD66VcNFN5v3Hdoxmu8",
        },
      },
    },
  },
  {
    plan: "CUSTOM",
    tagline: "For businesses with custom needs",
    clicksLimit: "Unlimited link clicks",
    copy: "Ideal for testing and creating pages",
    features: [
      {
        text: "Free custom domains",
        footnote:
          "Just bring any domain you own and turn it into a custom domain link shortener for free.",
      },
      { text: "Unlimited branded links" },
      { text: "Unlimited projects" },
      { text: "Password-protected links" },
      { text: "Custom Social Previews", footnote: "todo: use photo" },
      {
        text: "Root domain redirect",
        footnote:
          "Redirect vistors that land on the root of your domain (e.g. yourdomain.com) to a page of your choice.",
      },
      { text: "SSO/SAML" },
    ],
    cta: "Contact us",
    ctaLink:
      "mailto:jhonsfran@builder.sh?subject=Interested%20in%20Dub%20Enterprise",
    limits: {
      views: 10000,
      organizations: 2,
      projects: 2,
      users: 2,
    },
    price: {
      monthly: {
        amount: 9,
        currency: "USD",
        priceIds: {
          test: "price_1MBbPRD66VcNFN5v3Hdoxmu8",
          production: "price_1MBbPRD66VcNFN5v3Hdoxmu8",
        },
      },
      yearly: {
        amount: 90,
        currency: "USD",
        priceIds: {
          test: "price_1MBbPRD66VcNFN5v3Hdoxmu8",
          production: "price_1MBbPRD66VcNFN5v3Hdoxmu8",
        },
      },
    },
  },
]
