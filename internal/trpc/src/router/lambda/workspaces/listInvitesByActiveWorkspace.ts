import { eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { invitesSelectBase } from "@unprice/db/validators"
import { z } from "zod"

import { protectedWorkspaceProcedure } from "#trpc"

export const listInvitesByActiveWorkspace = protectedWorkspaceProcedure
  .input(z.void())
  .output(
    z.object({
      invites: z.array(invitesSelectBase),
    })
  )
  .query(async (opts) => {
    const workspace = opts.ctx.workspace

    const invites = await opts.ctx.db.query.invites.findMany({
      where: eq(schema.invites.workspaceId, workspace.id),
    })

    return {
      invites: invites,
    }
  })
