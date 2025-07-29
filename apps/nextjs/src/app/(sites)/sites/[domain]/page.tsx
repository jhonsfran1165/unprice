import Link from "next/link"
import { notFound } from "next/navigation"
import Script from "next/script"
import Footer from "~/components/layout/footer"
import Header from "~/components/layout/header"
import HeaderMarketing from "~/components/layout/header-marketing"
import { env } from "~/env"
import { generateColorsFromBackground } from "~/lib/colors"
import { getPageData } from "~/lib/fetchers"
import { getImageSrc, isSvgLogo } from "~/lib/image"
import { verifyPreviewToken } from "~/lib/preview"
import { unprice } from "~/lib/unprice"
import { ApplyTheme } from "../_components/apply-theme"
import { ErrorMessage } from "../_components/error-message"
import { Faqs } from "../_components/faqs"
import FooterSites from "../_components/footer"
import { ForceRefreshOnPreview } from "../_components/force-revalidate"
import type { PricingPlan } from "../_components/pricing-card"
import { FeatureComparison } from "../_components/pricing-comparision"
import { PricingTable } from "../_components/pricing-table"

// TODO: generate metadata https://github.com/vercel/platforms/blob/main/app/s/%5Bsubdomain%5D/page.tsx
// check shadcn landing page for inspiration
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
  // we use `getPageData` to fetch the page data and cache it.
  // Instead of using `api.pages.findFirst` directly
  const page = await getPageData(domain)

  if (!page) {
    notFound()
  }

  // activate preview mode
  const isPreview = !!(revalidate && verifyPreviewToken(revalidate, page.id))

  // if it's not publish and is not preview, show a 404 page
  if (!page.published && !isPreview) {
    return <ErrorMessage isPreview={isPreview} published={page.published} />
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
          id: version.id,
          name: version.plan.slug,
          flatPrice: version.flatPrice,
          currency: version.currency,
          description: version.description || "No description available",
          features,
          detailedFeatures,
          cta: version.plan.enterprisePlan ? "Contact Us" : "Get Started",
          ctaLink: page.ctaLink,
          isEnterprisePlan: version.plan.enterprisePlan || false,
          billingPeriod: version.billingConfig.billingInterval,
          contactEmail: page.project.contactEmail,
          version: version.version.toString(),
        }
      })
      .filter(Boolean) as PricingPlan[]) || []

  const { text } = generateColorsFromBackground(page.colorPalette?.primary)
  const isUnprice = page.customDomain?.endsWith("unprice.dev")

  return (
    <div>
      {env.TINYBIRD_TOKEN ? (
        <Script
          defer
          strategy="afterInteractive"
          src="/track.js"
          data-host={env.TINYBIRD_URL}
          data-proxy={" "}
          data-storage={"cookie"}
          data-token={env.TINYBIRD_TOKEN}
          data-tb-page_id={page.id}
          data-plan-ids={plans.map((plan) => plan.id).join(",")}
        />
      ) : null}
      <ApplyTheme
        cssVars={{
          "black-a12": text,
          "white-a12": text,
          "amber-5": page.colorPalette.primary,
          "amber-6": page.colorPalette.primary,
          "amber-7": page.colorPalette.primary,
          "amber-8": page.colorPalette.primary,
          "amber-9": page.colorPalette.primary,
        }}
      />
      <ForceRefreshOnPreview isPreview={isPreview} domain={domain} />
      {/* add small banner when the page is on preview mode */}
      {isPreview && (
        <div className="bg-info p-2 text-center text-info-foreground text-sm">
          This page is on preview mode.
        </div>
      )}

      {!isUnprice ? (
        <Header isUnprice={false}>
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
      ) : (
        <HeaderMarketing />
      )}
      <main className="container mx-auto space-y-24 px-4 py-16">
        <PricingTable plans={plans} popularPlan="PRO" title={page.title} subtitle={page.copy} />
        <FeatureComparison plans={plans} />
        <Faqs faqs={page.faqs ?? []} />
      </main>
      {!isUnprice ? <FooterSites domain={page.customDomain ?? domain} /> : <Footer />}
    </div>
  )
}
