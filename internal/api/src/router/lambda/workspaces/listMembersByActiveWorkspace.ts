import { listMembersSchema } from "@unprice/db/validators"
import { z } from "zod"

import { protectedWorkspaceProcedure } from "#/trpc"

export const listMembersByActiveWorkspace = protectedWorkspaceProcedure
  .input(z.void())
  .output(
    z.object({
      members: z.array(listMembersSchema),
    })
  )
  .query(async (opts) => {
    const workspace = opts.ctx.workspace

    const members = await opts.ctx.db.query.members.findMany({
      with: {
        user: true,
        workspace: true,
      },
      where: (member, { eq, and }) => and(eq(member.workspaceId, workspace.id)),
      orderBy: (members) => members.createdAtM,
    })

    return {
      members: members,
    }
  })
