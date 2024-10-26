import { TRPCError } from "@trpc/server"
import { customerSignUpSchema } from "@unprice/db/validators"
import { SubscriptionStateMachine } from "@unprice/services/subscriptions"
import { z } from "zod"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"

export const signUp = protectedApiOrActiveProjectProcedure
  .meta({
    span: "customers.signUp",
    openapi: {
      method: "POST",
      path: "/edge/customers.signUp",
      protect: true,
    },
  })
  .input(customerSignUpSchema)
  .output(
    z.object({
      success: z.boolean(),
      url: z.string(),
      customerId: z.string(),
      error: z.string().optional(),
    })
  )
  .mutation(async (opts) => {
    const project = opts.ctx.project

    // get the status from the subscription
    const subscription = await opts.ctx.db.query.subscriptions.findFirst({
      where: (subscriptions, { eq, and }) =>
        and(
          eq(subscriptions.id, "sub_3Ubc58LoPuGGrnbmiS848oNUZ7ih"),
          eq(subscriptions.projectId, project.id)
        ),
      with: {
        customer: true,
        phases: {
          with: {
            items: {
              with: {
                featurePlanVersion: {
                  with: {
                    feature: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!subscription) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" })
    }

    const subscriptionStateMachine = new SubscriptionStateMachine({
      db: opts.ctx.db,
      subscription,
      logger: opts.ctx.logger,
      analytics: opts.ctx.analytics,
    })

    const result = await subscriptionStateMachine.endTrial({ now: Date.now() })

    console.log(result)
    return {
      success: true,
      url: "https://google.com",
      customerId: "cus_3UcG1ATVkrbjfuNZpLvo6aLq7F59",
    }

    // return await signUpCustomer({
    //   input: opts.input,
    //   ctx: opts.ctx,
    //   projectId: project.id,
    // })
  })
