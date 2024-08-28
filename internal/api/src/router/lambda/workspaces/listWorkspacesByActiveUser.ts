import { workspaceSelectBase } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProcedure } from "../../../trpc"

export const listWorkspacesByActiveUser = protectedProcedure
  .input(z.void())
  .output(
    z.object({
      workspaces: z.array(
        workspaceSelectBase.extend({
          role: z.string(),
          userId: z.string(),
        })
      ),
    })
  )
  .query(async (opts) => {
    const userId = opts.ctx.session?.user?.id

    const memberships = await opts.ctx.db.query.members.findMany({
      with: {
        workspace: true,
      },
      where: (member, operators) => operators.eq(member.userId, userId),
      orderBy: (member) => member.createdAtM,
    })

    const workspaces = memberships.map((member) => ({
      ...member.workspace,
      role: member.role,
      userId: member.userId,
    }))

    return {
      workspaces: workspaces,
    }
  })
