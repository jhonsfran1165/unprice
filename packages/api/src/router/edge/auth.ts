import { clerkClient } from "@builderai/auth"

import { createTRPCRouter, protectedProcedure } from "../../trpc"

export const authRouter = createTRPCRouter({
  mySubscription: protectedProcedure.query(async (opts) => {
    const workspace = await opts.ctx.db.query.workspaces.findFirst({
      columns: {
        plan: true,
        billingPeriodStart: true,
        billingPeriodEnd: true,
      },
      where: (workspace, { eq }) => eq(workspace.tenantId, opts.ctx.tenantId),
    })

    return {
      plan: workspace?.plan ?? null,
      billingPeriodEnd: workspace?.billingPeriodEnd ?? null,
    }
  }),
  listOrganizations: protectedProcedure.query(async (opts) => {
    const memberships = await clerkClient.users.getOrganizationMembershipList({
      userId: opts.ctx.auth.userId,
    })

    return memberships.map(({ organization }) => ({
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      image: organization.imageUrl,
    }))
  }),
})
