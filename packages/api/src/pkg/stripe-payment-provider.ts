import type { PlanVersionFeatureExtended } from "@builderai/db/validators"
import { configFeatureSchema } from "@builderai/db/validators"
import type { Stripe } from "@builderai/stripe"
import { stripe, StripeClient } from "@builderai/stripe"

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

  public async createProduct(planVersionFeature: PlanVersionFeatureExtended) {
    // TODO: add app name to the product name
    const productName = `${planVersionFeature.project.name} - ${planVersionFeature.feature.slug} from Builderai`

    // check if the product already exists
    try {
      await this.client.products.retrieve(planVersionFeature.featureId)
    } catch (error) {
      return this.client.products.create({
        id: planVersionFeature.featureId,
        name: productName,
        type: "service",
        description: planVersionFeature.feature.description ?? "",
      })
    }
  }

  public createPrice(planVersionFeature: PlanVersionFeatureExtended) {
    switch (planVersionFeature.featureType) {
      case "flat":
        const config = configFeatureSchema.parse(planVersionFeature.config)

        const { planType, billingPeriod } = planVersionFeature.planVersion

        if (billingPeriod && planType === "recurring") {
          // TODO: fix this price
          const price = parseInt(config.price ?? "") * 100

          // TODO: how to avoid creating the price multiple times?
          return this.client.prices.create({
            product: planVersionFeature.featureId,
            currency: planVersionFeature.planVersion.currency,
            unit_amount: price,
            recurring: {
              interval: billingPeriod,
            },
            metadata: {
              planVersionFeatureId: planVersionFeature.id,
            },
            lookup_key: planVersionFeature.id,
          })
        }

        break
      default:
        throw new Error("Invalid feature type")
    }
  }
}
