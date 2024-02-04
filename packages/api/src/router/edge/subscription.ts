import { z } from "zod"

import { createUserSchema, user } from "@builderai/db/schema/subscription"
import { newIdEdge } from "@builderai/db/utils"

import { createTRPCRouter, protectedOrgProcedure } from "../../trpc"
import { hasAccessToProject } from "../../utils"

export const subscriptionRouter = createTRPCRouter({
  createUser: protectedOrgProcedure
    .input(createUserSchema)
    .mutation(async (opts) => {
      const { projectSlug, email, name } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const userId = newIdEdge("user")

      const userData = await opts.ctx.db
        .insert(user)
        .values({
          id: userId,
          projectId: project.id,
          tenantId: opts.ctx.tenantId,
          name,
          email,
        })
        .returning()

      return userData[0]
    }),

  listUsersByProject: protectedOrgProcedure
    .input(z.object({ projectSlug: z.string() }))
    .query(async (opts) => {
      const { projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const users = await opts.ctx.txRLS(({ txRLS }) =>
        txRLS.query.user.findMany({
          where: (user, { eq }) => eq(user.projectId, project.id),
        })
      )

      return {
        users: users,
      }
    }),
})
