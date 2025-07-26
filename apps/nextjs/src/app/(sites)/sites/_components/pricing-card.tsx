"use client"

import { Check } from "lucide-react"
import type * as React from "react"

import { Button } from "@unprice/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@unprice/ui/card"
import { cn } from "@unprice/ui/utils"
import Cookies from "js-cookie"

export interface PricingPlan {
  name: string
  id: string
  flatPrice: string
  isEnterprisePlan: boolean
  contactEmail: string
  description: string
  features: string[]
  detailedFeatures: Record<
    string,
    {
      value: string | number | boolean
      title: string
      type: "flat" | "usage" | "tier" | "package"
    }
  >[]
  cta: string
  ctaLink: string
  currency: string
  billingPeriod: string
}

export interface PricingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  plan: PricingPlan
  isPopular: boolean
  isOnly: boolean
}

export function PricingCard({ plan, isPopular, className, isOnly, ...props }: PricingCardProps) {
  const currentPrice = plan.flatPrice

  return (
    <Card
      className={cn("flex flex-col", isPopular && "relative border-primary shadow-lg", className)}
      style={
        isPopular
          ? {
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            }
          : {}
      }
      {...props}
    >
      {isPopular && (
        <div className="-top-4 absolute right-0 left-0 flex justify-center">
          <span className="rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground text-sm">
            Recommended
          </span>
        </div>
      )}
      <CardHeader className="space-y-2">
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription className="mt-2 line-clamp-2">{plan.description}</CardDescription>
        <div className="mt-10">
          {plan.isEnterprisePlan ? (
            <div className="invisible flex items-baseline">
              <span className="font-bold text-3xl">{currentPrice}</span>
              <span className="ml-1 text-muted-foreground">/{plan.billingPeriod}</span>
            </div>
          ) : (
            <div className="flex items-baseline">
              <span className="font-bold text-3xl">{currentPrice}</span>
              <span className="ml-1 text-muted-foreground">/{plan.billingPeriod}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center">
              <Check className="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className={cn("w-full", {
            "bg-primary text-primary-foreground": isPopular || isOnly,
          })}
          variant={isPopular || isOnly ? "primary" : "default"}
          onClick={() => {
            const ctaLink = new URL(plan.ctaLink)
            const sessionId = Cookies.get("session-id")
            ctaLink.searchParams.set("sessionId", sessionId ?? "")

            // @ts-ignore
            window.Tinybird.trackEvent("plan_click", {
              id: plan.id,
              slug: plan.name,
            })

            // if enterprise we need email
            if (plan.isEnterprisePlan) {
              // open mailto: with the email with subject and body
              const subject = `Enterprise Plan Inquiry for ${plan.name}`
              const body = `I'm interested in the ${plan.name} (enterprise plan). Please contact me.`
              window.open(`mailto:${plan.contactEmail}?subject=${subject}&body=${body}`, "_blank")
            } else {
              window.open(ctaLink.toString(), "_blank")
            }
          }}
        >
          {plan.cta}
        </Button>
      </CardFooter>
    </Card>
  )
}
