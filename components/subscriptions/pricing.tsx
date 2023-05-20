"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import Confetti from "react-dom-confetti"

import { pricingSubscriptions } from "@/lib/config/subscriptions"
import { useStore } from "@/lib/stores/layout"
import { getStripe } from "@/lib/stripe/client"
import { cn, fetchAPI, nFormatter } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/shared/icons"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"

const Pricing = () => {
  const [tier, setTier] = useState(0)
  const { orgSlug } = useStore()

  const [priceIdLoading, setPriceIdLoading] = useState(false)
  const [annualBilling, setAnnualBilling] = useState(false)
  const period = useMemo(
    () => (annualBilling ? "yearly" : "monthly"),
    [annualBilling]
  )

  // TODO: CONFIGURE current PLAN
  const currentPlan = "Free"

  const searchParams = useSearchParams()

  const handleCheckout = async (stripePriceId: string) => {
    setPriceIdLoading(true)
    // if (!user) {
    //   return router.push('/signin');
    // }
    // if (subscription) {
    //   return router.push('/account');
    // }

    try {
      const response = await fetchAPI({
        url: "/api/stripe/create-checkout-session",
        method: "POST",
        data: {
          stripePriceId,
          orgSlug,
          currency: "USD",
          metadata: {
            tier: "PRO",
          },
        },
      })

      const { id: sessionId } = response
      const stripe = await getStripe()
      stripe?.redirectToCheckout({ sessionId })
    } catch (error) {
      toast({
        title: "Error saving org",
        description: error.message,
        className: "danger",
      })
    } finally {
      setPriceIdLoading(false)
    }
  }

  return (
    <MaxWidthWrapper className="my-10 text-center">
      <div>
        <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
          Simple,{" "}
          <span className="bg-gradient-to-r from-primary-solid to-secondary-solid bg-clip-text text-transparent">
            affordable
          </span>{" "}
          pricing
        </h2>
        <p className="mt-5 text-background-textContrast sm:text-lg">
          Start for free, no credit card required. Upgrade anytime.
        </p>
      </div>

      <div className="relative mx-auto my-14 flex w-96 items-center justify-center">
        <div className="flex flex-row items-center justify-center space-x-2">
          <p>Billed Monthly</p>
          <Confetti
            active={period === "yearly"}
            config={{ elementCount: 200, spread: 90 }}
          />
          <Switch
            onCheckedChange={(value) => {
              setAnnualBilling(value)
            }}
          />
          <p className="pl-2">Billed Annually</p>
        </div>
        <span className="absolute -top-5 -right-16 rounded-full border bg-info-solid px-3 py-1 text-xs text-info-textContrast">
          🎁 2 month FREE
        </span>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {pricingSubscriptions.map(
          ({ plan, tagline, clicksLimit, features, cta, ctaLink, price }) => (
            <div
              key={plan}
              className={`relative rounded-2xl bg-background-bgSubtle ${
                plan === "PRO"
                  ? "border-2 border-primary-solid shadow-primary-line"
                  : "border-gray-200 border"
              } shadow-lg`}
            >
              {plan === "PRO" && (
                <div className="absolute inset-x-0 -top-5 mx-auto w-32 rounded-full bg-gradient-to-r from-primary-solid to-secondary-solid px-3 py-2 text-sm font-medium text-primary-textContrast">
                  Popular
                </div>
              )}
              <div className="p-5">
                <h3 className="font-display my-3 text-center text-3xl font-bold">
                  {plan}
                </h3>
                <p className="text-gray-500">{tagline}</p>
                {plan === "CUSTOM" ? (
                  <p className="font-display my-5 text-6xl font-semibold">
                    Custom
                  </p>
                ) : (
                  <div className="my-5 flex justify-center">
                    <p className="font-display text-6xl font-semibold">
                      $
                      {plan === "PRO"
                        ? period === "yearly"
                          ? nFormatter(price.yearly.amount / 12, 1)
                          : price.monthly.amount
                        : 0}
                    </p>
                  </div>
                )}
                <p className="text-gray-500">
                  per {period === "yearly" ? "month, billed annually" : "month"}
                </p>
              </div>
              <div className="flex h-20 flex-row items-center justify-center space-x-1 border-y">
                <div className="flex items-center justify-center space-x-1">
                  <p className="text-background-textContrast">{clicksLimit}</p>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Icons.help className="h-4 w-4" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          If you exceed your monthly usage, your existing links
                          will still work, but you need to upgrade to view their
                          stats/add more links. Link clicks are shared across
                          all projects.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <ul className="my-10 space-y-5 px-10">
                {features.map(({ text, footnote, negative }) => (
                  <li key={text} className="flex space-x-5">
                    <div className="shrink-0">
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
                {/* <Link
                  href={ctaLink}
                  
                > */}
                {/* <Button className="w-28 button-primary">

                </Button> */}
                <Button
                  className={cn(
                    "block w-full rounded-full py-2 font-semibold transition-all",
                    {
                      "border border-primary-border bg-gradient-to-r from-primary-solid to-secondary-solid text-black hover:bg-clip-text hover:text-primary-solid":
                        plan === "PRO",
                      "button-default": plan !== "PRO",
                    }
                  )}
                  onClick={async () => {
                    handleCheckout(price[period].priceIds.test)
                  }}
                >
                  {cta}
                </Button>
                {/* </Link> */}
              </div>
            </div>
          )
        )}
      </div>
    </MaxWidthWrapper>
  )
}

export default Pricing
