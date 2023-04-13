"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Confetti from "react-dom-confetti"

import { PRO_TIERS } from "@/lib/stripe/constants"
import { nFormatter } from "@/lib/utils"
import { Icons } from "@/components/shared/icons"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// TODO: refactor this to constants
const pricingItems = [
  {
    plan: "Free",
    tagline: "For startups & side projects",
    clicksLimit: "Up to 1K link clicks/mo",
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
    ctaLink: "https://app.dub.sh/register",
  },
  {
    plan: "Pro",
    tagline: "For larger teams with increased usage",
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
    ctaLink: "https://app.dub.sh/register",
  },
  {
    plan: "Enterprise",
    tagline: "For businesses with custom needs",
    clicksLimit: "Unlimited link clicks",
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
    ctaLink: "mailto:steven@dub.sh?subject=Interested%20in%20Dub%20Enterprise",
  },
]

const Pricing = () => {
  const [tier, setTier] = useState(0)
  const [annualBilling, setAnnualBilling] = useState(false)
  const period = useMemo(
    () => (annualBilling ? "yearly" : "monthly"),
    [annualBilling]
  )

  return (
    <MaxWidthWrapper className="my-10 text-center">
      <div id="pricing" className="mx-auto my-10 sm:max-w-lg">
        <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
          Simple,{" "}
          <span className="bg-gradient-to-r from-primary-solid to-secondary-solid bg-clip-text text-transparent">
            usage-based
          </span>{" "}
          pricing
        </h2>
        <p className="mt-5 text-background-textContrast sm:text-lg">
          Start for free, no credit card required. Upgrade anytime.
        </p>
      </div>

      <div className="flex justify-center mx-auto my-14 items-center w-96 relative">
        <div className="flex flex-row justify-center items-center">
          <p className="mr-2">Billed Monthly</p>
          <Confetti
            active={period === "yearly"}
            config={{ elementCount: 200, spread: 90 }}
          />
          <Switch
            className="border-background-solid bg-background ring-background-solid data-[state=unchecked]:bg-background data-[state=checked]:bg-primary-solid"
            onCheckedChange={(value) => {
              setAnnualBilling(value)
            }}
          />
          <p className="ml-2">Billed Annually</p>
        </div>
        <span className="absolute -top-5 -right-16 rounded-full border px-3 py-1 text-xs bg-info-solid text-info-textContrast">
          🎁 1 months FREE
        </span>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {pricingItems.map(
          ({ plan, tagline, clicksLimit, features, cta, ctaLink }) => (
            <div
              key={plan}
              className={`relative rounded-2xl bg-background-bgSubtle ${
                plan === "Pro"
                  ? "border-2 border-primary-solid shadow-primary-line"
                  : "border border-gray-200"
              } shadow-lg`}
            >
              {plan === "Pro" && (
                <div className="absolute -top-5 left-0 right-0 mx-auto w-32 rounded-full bg-gradient-to-r from-primary-solid to-secondary-solid px-3 py-2 text-sm font-medium text-primary-textContrast">
                  Popular
                </div>
              )}
              <div className="p-5">
                <h3 className="my-3 text-center font-display text-3xl font-bold">
                  {plan}
                </h3>
                <p className="text-gray-500">{tagline}</p>
                {plan === "Enterprise" ? (
                  <p className="my-5 font-display text-6xl font-semibold">
                    Custom
                  </p>
                ) : (
                  <div className="my-5 flex justify-center">
                    <p className="font-display text-6xl font-semibold">
                      $
                      {plan === "Pro"
                        ? period === "yearly"
                          ? nFormatter(
                              PRO_TIERS[tier].price.yearly.amount / 12,
                              1
                            )
                          : PRO_TIERS[tier].price.monthly.amount
                        : 0}
                    </p>
                  </div>
                )}
                <p className="text-gray-500">
                  per {period === "yearly" ? "month, billed annually" : "month"}
                </p>
              </div>
              <div className="flex flex-row h-20 items-center justify-center border-t border-b space-x-1">
                {plan === "Pro" ? (
                  <div className="flex flex-col items-center space-y-1">
                    <Slider
                      // defaultValue={[tier]}
                      max={PRO_TIERS.length - 1}
                      // step={PRO_TIERS.length - 1}
                      className="w-[60%] border-primary-solid bg-primary ring-primary-solid"
                    />
                    <div className="flex items-center">
                      <p className="text-sm">
                        Up to {nFormatter(PRO_TIERS[tier].quota)} link clicks/mo
                      </p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Icons.help className="h-4 w-4 " />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              If you exceed your monthly usage, your existing
                              links will still work, but you need to upgrade to
                              view their stats/add more links. Link clicks are
                              shared across all projects.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-1">
                    <p className="text-background-textContrast">
                      {clicksLimit}
                    </p>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Icons.help className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            If you exceed your monthly usage, your existing
                            links will still work, but you need to upgrade to
                            view their stats/add more links. Link clicks are
                            shared across all projects.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
              <ul className="my-10 space-y-5 px-10">
                {features.map(({ text, footnote, negative }) => (
                  <li key={text} className="flex space-x-5">
                    <div className="flex-shrink-0">
                      {negative ? (
                        <Icons.xCircle className="h-6 w-6 text-danger-solid" />
                      ) : (
                        <Icons.checkCircle className="h-6 w-6 text-success-solid" />
                      )}
                    </div>
                    {footnote ? (
                      <div className="flex items-center">
                        <p className={""}>{text}</p>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex h-4 w-8 justify-center">
                                <Icons.help className="h-4 w-4" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="w-80">
                              {footnote}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ) : (
                      <p className={""}>{text}</p>
                    )}
                  </li>
                ))}
              </ul>
              <div className="border-t" />
              <div className="p-5">
                <Link
                  href={ctaLink}
                  className={`${
                    plan === "Pro"
                      ? "border border-transparent bg-gradient-to-r from-primary-solid to-secondary-solid text-primary-textContrast hover:bg-clip-text"
                      : "border bg-background hover:border-background-borderHover hover:text-background-textContrast hover:bg-background-bgHover active:bg-background-bgActive"
                  } block w-full rounded-full py-2 font-medium transition-all`}
                >
                  {cta}
                </Link>
              </div>
            </div>
          )
        )}
      </div>
    </MaxWidthWrapper>
  )
}

export default Pricing
