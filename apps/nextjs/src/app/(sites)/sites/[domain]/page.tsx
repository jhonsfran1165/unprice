import { revalidateTag } from "next/cache"
import Link from "next/link"
import { notFound } from "next/navigation"
import Header from "~/components/layout/header"
import { generateColorsFromBackground } from "~/lib/colors"
import { getPageData } from "~/lib/fetchers"
import { getImageSrc, isSvgLogo } from "~/lib/image"
import { verifyPreviewToken } from "~/lib/preview"
import { unprice } from "~/lib/unprice"
import { ApplyTheme } from "../_components/apply-theme"
import { Faqs } from "../_components/faqs"
import type { PricingPlan } from "../_components/pricing-card"
import { FeatureComparison } from "../_components/pricing-comparision"
import { PricingTable } from "../_components/pricing-table"

// TODO: generate metadata https://github.com/vercel/platforms/blob/main/app/s/%5Bsubdomain%5D/page.tsx
export default async function DomainPage({
  params: { domain },
  searchParams: { revalidate },
}: {
  params: {
    domain: string
  }
  searchParams: {
    revalidate?: string
  }
}) {
  const isPreview = revalidate && verifyPreviewToken(revalidate, domain)
  // revalidate the page if the token is valid
  if (isPreview) {
    revalidateTag(`sites:${domain}`)
  }

  // we use `getPageData` to fetch the page data and cache it.
  // Instead of using `api.pages.findFirst` directly
  const page = await getPageData(domain)

  if (!page) {
    notFound()
  }

  const selectedPlans = page?.selectedPlans ?? []

  // unprice api handles the cache
  const plansUnprice = await Promise.all(
    selectedPlans.map(async (plan) => {
      const planVersion = await unprice.plans.getPlanVersion(plan.id)
      return planVersion.result?.planVersion ?? null
    })
  )

  // Transform Unprice plans to match our PricingPlan interface
  const plans =
    (plansUnprice
      .map((version) => {
        if (!version) {
          return null
        }

        // Get features from plan features
        const features =
          version.planFeatures
            .filter((feature) => !feature.hidden)
            .map((feature) => {
              return feature.displayFeatureText
            }) || []

        const detailedFeatures =
          version.planFeatures
            .filter((feature) => !feature.hidden)
            .map((feature) => {
              return {
                [feature.feature.title]: {
                  value: feature.displayFeatureText,
                  title: feature.feature.title,
                  type: feature.featureType,
                },
              }
            }) || []

        return {
          name: version.plan.slug,
          flatPrice: version.flatPrice,
          currency: version.currency,
          description: version.description || "No description available",
          features,
          detailedFeatures,
          cta: version.plan.enterprisePlan ? "Contact Us" : "Get Started",
          isEnterprisePlan: version.plan.enterprisePlan || false,
          billingPeriod: version.billingConfig.billingInterval,
        }
      })
      .filter(Boolean) as PricingPlan[]) || []

  const { text } = generateColorsFromBackground(page.colorPalette?.primary)

  return (
    <div>
      <ApplyTheme
        cssVars={{
          "amber-9": page.colorPalette?.primary,
          "black-a12": text,
          "white-a12": text,
          "amber-7": page.colorPalette?.primary,
          "amber-8": page.colorPalette?.primary,
        }}
      />
      {/* add small banner when the page is on preview mode */}
      {isPreview && (
        <div className="bg-info p-2 text-center text-info-foreground text-sm">
          This page is on preview mode.
        </div>
      )}

      <Header>
        <div className="flex items-center space-x-2">
          <Link href="/">
            <img
              src={getImageSrc(page.logo, page.logoType ?? "")}
              alt="Current page logo"
              className="max-h-32 max-w-32 rounded object-contain"
              {...(isSvgLogo(page.logoType ?? "") ? { width: 128, height: 128 } : {})}
              aria-label="Current page logo"
            />
          </Link>
        </div>
      </Header>
      <main className="container mx-auto space-y-24 px-4 py-16">
        <PricingTable plans={plans} popularPlan="PRO" title={page.title} subtitle={page.copy} />
        <FeatureComparison plans={plans} />
        <Faqs faqs={page.faqs ?? []} />
      </main>
    </div>
  )
}
