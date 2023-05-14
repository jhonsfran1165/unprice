import { NextApiRequest, NextApiResponse } from "next"
import Stripe from "stripe"

import {
  withAuthentication,
  withMethods,
  withValidation,
} from "@/lib/api-middlewares"
import { stripe } from "@/lib/stripe"
import { supabaseApiClient } from "@/lib/supabase/supabase-api"
import { Organization, Profile, Session } from "@/lib/types/supabase"
import { getAppRootUrl } from "@/lib/utils"
import { stripePostSchema } from "@/lib/validations/stripe"

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session: Session,
  profile: Profile
) {
  try {
    const supabase = supabaseApiClient(req, res)

    if (req.method === "POST") {
      const { orgSlug, stripePriceId, trialDays, metadata, currency } = req.body

      console.log(req.body)

      const { data: org, error } = await supabase
        .from("organization")
        .select("*")
        .eq("slug", orgSlug)
        .single()

      if (!org)
        return res.status(404).json({ message: "organization not found" })

      const sessionData = {
        payment_method_types: ["card"],
        billing_address_collection: "required",
        success_url: `${getAppRootUrl()}/org/${orgSlug}/settings/billing`,
        cancel_url: `${getAppRootUrl()}/org/${orgSlug}`,
        line_items: [{ price: stripePriceId, quantity: 1 }],
        allow_promotion_codes: true,
        currency,
        subscription_data: {
          trial_from_plan: true,
          trial_period_days: trialDays,
          metadata: {
            orgId: org.id,
            userIdMakePayment: session.user.id,
            ...metadata,
          },
        },
        // TODO: activate after activating stripe or activate only in prod
        // tax_id_collection: {
        //   enabled: true,
        // },
        // automatic_tax: {
        //   enabled: true,
        // },
        mode: "subscription",
        client_reference_id: org?.id.toString(),
      } as Stripe.Checkout.SessionCreateParams

      if (org.stripe_id) {
        sessionData["customer"] = org.stripe_id
      } else {
        sessionData["customer_email"] = session?.user.email
      }

      console.log(session.user.app_metadata.organizations[org.id].role)
      const stripeSession = await stripe.checkout.sessions.create(sessionData)

      if (error) return res.status(500).json(error)

      return res.status(200).json(stripeSession)
    }
  } catch (error) {
    return res.status(500).json(error)
  }
}

const validMethods = ["POST"]

export default withMethods(
  // valid methods for this endpoint
  validMethods,
  // validate payload for this methods
  withValidation(
    {
      POST: stripePostSchema,
    },
    withAuthentication(handler, {
      protectedMethods: ["POST"],
      needProfileDetails: true,
    })
  )
)
