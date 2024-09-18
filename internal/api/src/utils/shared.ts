import { TRPCError } from "@trpc/server"
import { type Database, and, eq, sql } from "@unprice/db"
import { customerSessions, customers, members, subscriptions, workspaces } from "@unprice/db/schema"
import { createSlug, newId } from "@unprice/db/utils"
import {
  type CustomerSignUp,
  type WorkspaceInsert,
  createSubscriptionDB,
  type subscriptionInsertSchema,
} from "@unprice/db/validators"
import { getMonth, getYear } from "date-fns"
import type { z } from "zod"
import { UnpriceCustomer } from "../pkg/customer"
import { UnPriceCustomerError } from "../pkg/errors"
import { StripePaymentProvider } from "../pkg/payment-provider/stripe"
import type { Context } from "../trpc"

// shared logic for some procedures
// this way I use my product to build my product
// without setting up unprice sdk
export const verifyFeature = async ({
  customerId,
  featureSlug,
  projectId,
  ctx,
}: {
  customerId: string
  featureSlug: string
  projectId: string
  ctx: Context
}) => {
  const now = performance.now()
  const customer = new UnpriceCustomer({
    cache: ctx.cache,
    db: ctx.db as Database,
    analytics: ctx.analytics,
    logger: ctx.logger,
    metrics: ctx.metrics,
    waitUntil: ctx.waitUntil,
  })

  // current year and month - we only support current month and year for now
  const currentMonth = getMonth(Date.now()) + 1
  const currentYear = getYear(Date.now())

  const { err, val } = await customer.verifyFeature({
    customerId,
    featureSlug,
    projectId,
    year: currentYear,
    month: currentMonth,
    ctx,
  })

  const end = performance.now()

  ctx.metrics.emit({
    metric: "metric.feature.verification",
    duration: end - now,
    customerId,
    featureSlug,
    valid: !err,
    code: err?.code ?? "",
    service: "customer",
  })

  if (err) {
    switch (true) {
      case err instanceof UnPriceCustomerError:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.code,
        })
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error verifying feature: ${err.toString()}`,
        })
    }
  }

  return val
}

export const getEntitlements = async ({
  customerId,
  projectId,
  ctx,
}: {
  customerId: string
  projectId: string
  ctx: Context
}) => {
  const customer = new UnpriceCustomer({
    cache: ctx.cache,
    db: ctx.db as Database,
    analytics: ctx.analytics,
    logger: ctx.logger,
    metrics: ctx.metrics,
    waitUntil: ctx.waitUntil,
  })

  const { err, val } = await customer.getEntitlements({
    customerId,
    projectId,
  })

  if (err) {
    switch (true) {
      case err instanceof UnPriceCustomerError:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.code,
        })
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error verifying entitlements",
        })
    }
  }

  return val
}

export const reportUsageFeature = async ({
  customerId,
  featureSlug,
  projectId,
  usage,
  ctx,
}: {
  customerId: string
  featureSlug: string
  projectId: string
  workspaceId: string
  usage: number
  ctx: Context
}) => {
  const customer = new UnpriceCustomer({
    cache: ctx.cache,
    db: ctx.db as Database,
    analytics: ctx.analytics,
    logger: ctx.logger,
    metrics: ctx.metrics,
    waitUntil: ctx.waitUntil,
  })

  // current year and month - we only support current month and year for now
  const currentMonth = getMonth(Date.now()) + 1
  const currentYear = getYear(Date.now())

  const { err, val } = await customer.reportUsage({
    customerId,
    featureSlug,
    projectId,
    usage,
    year: currentYear,
    month: currentMonth,
  })

  if (err) {
    switch (true) {
      case err instanceof UnPriceCustomerError:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.code,
        })
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error verifying feature: ${err.toString()}`,
        })
    }
  }

  return val
}

export const createSubscription = async ({
  subscription,
  ctx,
  projectId,
}: {
  subscription: z.infer<typeof subscriptionInsertSchema>
  projectId: string
  ctx: Context
}) => {
  const { err, val } = await createSubscriptionDB({
    subscription,
    projectId,
    db: ctx.db,
  })

  if (err) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: err.message,
    })
  }

  const subscriptionData = val

  // every time a subscription is created, we save the subscription in the cache
  ctx.waitUntil(
    ctx.db.query.subscriptions
      .findMany({
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
        where: (sub, { eq, and }) =>
          and(
            eq(sub.customerId, subscriptionData.customerId),
            eq(sub.projectId, subscriptionData.projectId)
          ),
      })
      .then(async (subscriptions) => {
        if (!subscriptions || subscriptions.length === 0) {
          // TODO: log error
          console.error("Subscriptions not found")
          return
        }

        const customerEntitlements = subscriptions.flatMap((sub) =>
          sub.items.map((f) => {
            return {
              featureId: f.featurePlanVersion.id,
              featureSlug: f.featurePlanVersion.feature.slug,
              featureType: f.featurePlanVersion.featureType,
              aggregationMethod: f.featurePlanVersion.aggregationMethod,
              limit: f.featurePlanVersion.limit,
              units: f.units,
            }
          })
        )

        const customerSubscriptions = subscriptions.map((sub) => sub.id)
        const currentMonth = getMonth(Date.now()) + 1
        const currentYear = getYear(Date.now())

        return Promise.all([
          // save the customer entitlements
          ctx.cache.entitlementsByCustomerId.set(subscriptionData.customerId, customerEntitlements),
          // save the customer subscriptions
          ctx.cache.subscriptionsByCustomerId.set(
            subscriptionData.customerId,
            customerSubscriptions
          ),
          // save features
          subscriptions.flatMap((sub) =>
            sub.items.map((f) =>
              ctx.cache.featureByCustomerId.set(
                `${sub.customerId}:${f.featurePlanVersion.feature.slug}:${currentYear}:${currentMonth}`,
                {
                  id: f.id,
                  projectId: f.projectId,
                  featurePlanVersionId: f.featurePlanVersion.id,
                  subscriptionId: f.subscriptionId,
                  units: f.units,
                  featureType: f.featurePlanVersion.featureType,
                  aggregationMethod: f.featurePlanVersion.aggregationMethod,
                  limit: f.featurePlanVersion.limit,
                  currentUsage: 0,
                  lastUpdatedAt: 0,
                  realtime: !!f.featurePlanVersion.metadata?.realtime,
                }
              )
            )
          ),
        ])
      })
  )

  return {
    subscription: subscriptionData,
  }
}

export const signUpCustomer = async ({
  input,
  ctx,
  projectId,
}: {
  input: CustomerSignUp
  ctx: Context
  projectId: string
}): Promise<{ success: boolean; url: string; error?: string; customerId: string }> => {
  const {
    planVersionId,
    config,
    successUrl,
    cancelUrl,
    email,
    name,
    timezone,
    defaultCurrency,
    externalId,
  } = input

  const planVersion = await ctx.db.query.versions.findFirst({
    with: {
      project: true,
      plan: true,
    },
    where: (version, { eq, and }) =>
      and(eq(version.id, planVersionId), eq(version.projectId, projectId)),
  })

  if (!planVersion) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Plan version not found",
    })
  }

  if (planVersion.status !== "published") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Plan version is not published",
    })
  }

  if (planVersion.active === false) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Plan version is not active",
    })
  }

  const planProject = planVersion.project
  const paymentProvider = planVersion.paymentProvider
  const paymentRequired = planVersion.paymentMethodRequired ?? false
  const trialDays = planVersion.trialDays ?? 0
  const customerId = newId("customer")
  const customerSuccessUrl = successUrl.replace("{CUSTOMER_ID}", customerId)

  // if payment is required, we need to go through payment provider flow first
  if (paymentRequired && trialDays === 0) {
    switch (paymentProvider) {
      case "stripe": {
        const stripePaymentProvider = new StripePaymentProvider({
          logger: ctx.logger,
        })

        // create a session with the data of the customer, the plan version and the success and cancel urls
        // pass the session id to stripe metadata and then once the customer adds a payment method, we call our api to create the subscription
        const sessionId = newId("customer_session")
        const customerSession = await ctx.db
          .insert(customerSessions)
          .values({
            id: sessionId,
            customer: {
              id: customerId,
              name: name,
              email: email,
              currency: defaultCurrency || planProject.defaultCurrency,
              timezone: timezone || planProject.timezone,
              projectId: projectId,
              externalId: externalId,
            },
            planVersion: {
              id: planVersion.id,
              projectId: projectId,
              config: config,
            },
          })
          .returning()
          .then((data) => data[0])

        if (!customerSession) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error creating customer session",
          })
        }

        const { err, val } = await stripePaymentProvider.signUp({
          successUrl: customerSuccessUrl,
          cancelUrl: cancelUrl,
          customerSessionId: customerSession.id,
          customer: {
            id: customerId,
            email: email,
            currency: defaultCurrency || planProject.defaultCurrency,
          },
        })

        if (err ?? !val) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: err.message,
          })
        }

        return val
      }
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Payment provider not supported yet",
        })
    }
  }

  // if payment is not required, we can create the customer directly with its subscription
  try {
    await ctx.db.transaction(async (trx) => {
      const newCustomer = await trx
        .insert(customers)
        .values({
          id: customerId,
          name: name ?? email,
          email: email,
          projectId: projectId,
          defaultCurrency: defaultCurrency ?? planProject.defaultCurrency,
          timezone: timezone ?? planProject.timezone,
          active: true,
        })
        .returning()
        .then((data) => data[0])

      if (!newCustomer?.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating customer",
        })
      }

      // create the subscription
      const newSubscription = await createSubscription({
        subscription: {
          customerId: newCustomer.id,
          projectId: projectId,
          type: "plan",
          planVersionId: planVersion.id,
          startAt: Date.now(),
          status: "active",
          config: config,
          defaultPaymentMethodId: "",
          timezone: timezone ?? planProject.timezone,
          collectionMethod: planVersion.collectionMethod,
          whenToBill: planVersion.whenToBill,
          startCycle: planVersion.startCycle ?? 1,
          gracePeriod: planVersion.gracePeriod ?? 0,
        },
        projectId: projectId,
        ctx: {
          ...ctx,
          db: trx,
        },
      })

      if (!newSubscription.subscription.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating subscription",
        })
      }

      return { newCustomer, newSubscription }
    })

    return {
      success: true,
      url: customerSuccessUrl,
      customerId: customerId,
    }
  } catch (error) {
    const e = error as TRPCError

    return {
      success: false,
      url: cancelUrl,
      error: e.message,
      customerId: "",
    }
  }
}

export const createWorkspace = async ({
  input,
  ctx,
}: {
  input: WorkspaceInsert & {
    unPriceCustomerId: string
    name: string
  }
  ctx: Context
}) => {
  const { name, unPriceCustomerId, isInternal, id } = input
  const user = ctx.session?.user

  if (!user) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "User not found",
    })
  }

  let isPersonal = true

  // verify if the user is a member of any workspace
  const countMembers = await ctx.db
    .select({ count: sql<number>`count(*)` })
    .from(members)
    .where(and(eq(members.userId, user.id)))
    .then((res) => res[0]?.count ?? 0)

  // if the user is a member of any workspace, the workspace is not personal
  if (countMembers > 0) {
    isPersonal = false
  }

  // verify if the customer exists
  const customer = await ctx.db.query.customers.findFirst({
    where: (customer, { eq }) => eq(customer.id, unPriceCustomerId),
  })

  if (!customer) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Customer unrpice not found",
    })
  }

  // get the subscription of the customer
  const subscription = await ctx.db.query.subscriptions.findFirst({
    with: {
      planVersion: {
        with: {
          plan: true,
        },
      },
    },
    where: (subscription, { eq }) => eq(subscription.customerId, unPriceCustomerId),
  })

  if (!subscription) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Subscription not found",
    })
  }

  const newWorkspace = await ctx.db.transaction(async (tx) => {
    const slug = createSlug()

    // look if the workspace already has a customer
    const workspaceExists = await ctx.db.query.workspaces.findFirst({
      where: (workspace, { eq }) => eq(workspace.unPriceCustomerId, unPriceCustomerId),
    })

    let workspaceId = ""
    let workspace = undefined

    if (!workspaceExists?.id) {
      // create the workspace
      workspace = await tx
        .insert(workspaces)
        .values({
          id: id ?? newId("workspace"),
          slug: slug,
          name: name,
          imageUrl: user.image,
          isPersonal: isPersonal ?? false,
          isInternal: isInternal ?? false,
          createdBy: user.id,
          unPriceCustomerId: unPriceCustomerId,
          plan: subscription.planVersion.plan.slug,
        })
        .returning()
        .then((workspace) => {
          return workspace[0] ?? undefined
        })
        // TODO: use this method to throw errors in all api endpoints
        .catch((err) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: err.message,
          })
        })

      if (!workspace?.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating workspace",
        })
      }

      workspaceId = workspace.id
    } else {
      workspaceId = workspaceExists.id
      workspace = workspaceExists
    }

    // verify if the user is already a member of the workspace
    const member = await tx.query.members.findFirst({
      where: (member, { eq, and }) =>
        and(eq(member.workspaceId, workspaceId), eq(member.userId, user.id)),
    })

    // if so don't create a new member
    if (member) {
      return workspace
    }

    const memberShip = await tx
      .insert(members)
      .values({
        userId: user.id,
        workspaceId: workspaceId,
        role: "OWNER",
      })
      .returning()
      .then((members) => members[0] ?? null)
      .catch((err) => {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message,
        })
      })

    if (!memberShip?.userId) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error creating member",
      })
    }

    return workspace
  })

  return newWorkspace
}

export const signOutCustomer = async ({
  input,
  ctx,
}: {
  input: { customerId: string; projectId: string }
  ctx: Context
}) => {
  const { customerId, projectId } = input

  // cancel all subscriptions
  const customerSubs = await ctx.db.query.subscriptions.findMany({
    where: (subscription, { eq, and }) =>
      and(eq(subscription.customerId, customerId), eq(subscription.projectId, projectId)),
  })

  // all this should be in a transaction
  await ctx.db.transaction(async (tx) => {
    const cancelSubs = await Promise.all(
      customerSubs.map(async (sub) => {
        // check if the subscription is in trials, if so set the endAt to the trialEndsAt
        const endDate = sub.trialEndsAt
          ? sub.trialEndsAt > Date.now()
            ? sub.trialEndsAt
            : Date.now()
          : Date.now()

        await tx
          .update(subscriptions)
          .set({
            status: "canceled",
            metadata: {
              reason: "user_requested",
            },
            endAt: endDate,
          })
          .where(eq(subscriptions.id, sub.id))
      })
    )
      .catch((err) => {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message,
        })
      })
      .then(() => true)

    if (!cancelSubs) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error canceling subscription",
      })
    }

    // TODO: trigger payment to collect the last bill

    // TODO: send email to the customer

    // Deactivate the customer
    await tx
      .update(customers)
      .set({
        active: false,
      })
      .where(eq(customers.id, customerId))
      .catch((err) => {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message,
        })
      })
  })

  return {
    success: true,
  }
}
