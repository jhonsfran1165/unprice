import { APP_NAME } from "@unprice/config"
import type { PlanVersionFeatureExtended } from "@unprice/db/validators"
import { configFlatSchema, configTierSchema, configUsageSchema } from "@unprice/db/validators"
import type { Stripe } from "@unprice/stripe"
import { StripeClient, stripe } from "@unprice/stripe"

export class StripePaymentProvider {
  public readonly client: Stripe

  constructor(token?: string) {
    this.client = token
      ? new StripeClient(token, {
          apiVersion: "2023-10-16",
          typescript: true,
        })
      : stripe
  }

  public getProduct(id: string) {
    return this.client.products.retrieve(id)
  }

  public async createProduct(planVersionFeature: PlanVersionFeatureExtended) {
    const productName = `${planVersionFeature.project.name} - ${planVersionFeature.feature.slug} from ${APP_NAME}`

    // check if the product already exists
    try {
      await this.getProduct(planVersionFeature.featureId)
    } catch (_error) {
      return this.client.products.create({
        id: planVersionFeature.featureId,
        name: productName,
        type: "service", // TODO: do we need to change this?
        description: planVersionFeature.feature.description!,
      })
    }
  }

  public getPrice(id: string) {
    return this.client.prices.retrieve(id)
  }

  public listPrices(lookup_keys: string[], limit?: number) {
    return this.client.prices.list({
      lookup_keys,
      limit,
    })
  }

  public async createPrice(planVersionFeature: PlanVersionFeatureExtended) {
    switch (planVersionFeature.featureType) {
      case "flat": {
        const {
          featureId,
          config,
          id,
          feature: { slug },
          planVersion: { planType, billingPeriod, currency },
        } = planVersionFeature

        const { price } = configFlatSchema.parse(config)

        // we need to transform price to cents without rounding
        const priceInCents = Math.floor(Number.parseFloat(price.displayAmount) * 100).toFixed(2)

        try {
          const priceExist = await this.listPrices([id], 1)
          if (priceExist.data.length > 0) {
            return priceExist.data[0]
          }
        } catch (_error) {
          // do nothing
        }

        if (billingPeriod && planType === "recurring") {
          return this.client.prices.create({
            nickname: `Flat price ${slug}`,
            product: featureId,
            currency: currency,
            unit_amount_decimal: priceInCents,
            recurring: {
              interval_count: 1,
              interval: billingPeriod,
            },
            metadata: {
              planVersionFeatureId: id,
            },
            lookup_key: id,
          })
        }

        throw new Error("Error creating price for flat feature")
      }
      case "tier": {
        const {
          featureId,
          config,
          id,
          feature: { slug },
          planVersion: { planType, billingPeriod, currency },
        } = planVersionFeature

        const { tierMode, tiers } = configTierSchema.parse(config)

        // we need to transform price to cents without rounding for each tier
        const transformedTiersForStripe = tiers.map((tier) => {
          return {
            up_to: tier.lastUnit ?? ("inf" as const),
            unit_amount_decimal: Math.floor(
              Number.parseFloat(tier.unitPrice.displayAmount) * 100
            ).toFixed(2),
            flat_amount_decimal: tier.flatPrice
              ? Math.floor(Number.parseFloat(tier.flatPrice.displayAmount) * 100).toFixed(2)
              : undefined,
          }
        })

        try {
          const priceExist = await this.listPrices([id], 1)
          if (priceExist.data.length > 0) {
            return priceExist.data[0]
          }
        } catch (_error) {
          // do nothing
        }

        if (billingPeriod && planType === "recurring") {
          return this.client.prices.create({
            nickname: `Tiered price ${slug}`,
            product: featureId,
            currency: currency,
            recurring: {
              interval_count: 1,
              interval: billingPeriod,
              usage_type: "licensed", // automatically set the quantities when creating the subscription,
            },
            billing_scheme: "tiered",
            tiers_mode: tierMode,
            tiers: transformedTiersForStripe,
            metadata: {
              planVersionFeatureId: id,
            },
            expand: ["tiers"],
            lookup_key: id,
          })
        }

        throw new Error("Error creating price for flat feature")
      }

      case "usage": {
        const {
          featureId,
          config,
          id,
          feature: { slug },
          planVersion: { planType, billingPeriod, currency },
        } = planVersionFeature

        const { tierMode, tiers, usageMode, units, price } = configUsageSchema.parse(config)

        try {
          const priceExist = await this.listPrices([id], 1)
          if (priceExist.data.length > 0) {
            return priceExist.data[0]
          }
        } catch (_error) {
          // do nothing
        }

        if (usageMode === "tier" && tiers && tiers.length > 0) {
          // we need to transform price to cents without rounding for each tier
          const transformedTiersForStripe = tiers.map((tier) => {
            return {
              up_to: tier.lastUnit ?? ("inf" as const),
              unit_amount_decimal: Math.floor(
                Number.parseFloat(tier.unitPrice.displayAmount) * 100
              ).toFixed(2),
              flat_amount_decimal: tier.flatPrice
                ? Math.floor(Number.parseFloat(tier.flatPrice.displayAmount) * 100).toFixed(2)
                : undefined,
            }
          })

          if (billingPeriod && planType === "recurring") {
            return this.client.prices.create({
              nickname: `Usage tiered price ${slug}`,
              product: featureId,
              currency: currency,
              recurring: {
                interval: billingPeriod,
                usage_type: "metered", // quantities are set at the end of the billing period as usage records
                aggregate_usage: "sum",
                interval_count: 1,
              },
              billing_scheme: "tiered",
              tiers_mode: tierMode,
              tiers: transformedTiersForStripe,
              metadata: {
                planVersionFeatureId: id,
              },
              expand: ["tiers"],
              lookup_key: id,
            })
          }
        }

        if (usageMode === "unit" && price) {
          if (billingPeriod && planType === "recurring") {
            return this.client.prices.create({
              nickname: `Usage per unit price ${slug}`,
              product: featureId,
              currency: currency,
              recurring: {
                interval: billingPeriod,
                usage_type: "metered", // quantities are set at the end of the billing period as usage records
                aggregate_usage: "sum",
                interval_count: 1,
              },
              unit_amount_decimal: Math.floor(Number.parseFloat(price.displayAmount) * 100).toFixed(
                2
              ),
              billing_scheme: "per_unit",
              metadata: {
                planVersionFeatureId: id,
              },
              lookup_key: id,
            })
          }
        }

        if (usageMode === "package" && units && price) {
          if (billingPeriod && planType === "recurring") {
            return this.client.prices.create({
              nickname: `Usage tiered price ${slug}`,
              product: featureId,
              currency: currency,
              recurring: {
                interval: billingPeriod,
                usage_type: "metered", // quantities are set at the end of the billing period as usage records
                aggregate_usage: "sum",
                interval_count: 1,
              },

              unit_amount_decimal: Math.floor(Number.parseFloat(price.displayAmount) * 100).toFixed(
                2
              ),
              billing_scheme: "per_unit",
              metadata: {
                planVersionFeatureId: id,
              },
              lookup_key: id,
            })
          }
        }

        throw new Error("Error creating price for flat feature")
      }
      default:
        throw new Error("Invalid feature type")
    }
  }
}
