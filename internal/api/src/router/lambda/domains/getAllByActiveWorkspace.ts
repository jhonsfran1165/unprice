import { domainSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedWorkspaceProcedure } from "../../../trpc"

export const getAllByActiveWorkspace = protectedWorkspaceProcedure
  .input(z.void())
  .output(z.array(domainSelectBaseSchema))
  .query(async (opts) => {
    const workspace = opts.ctx.workspace

    const domains = await opts.ctx.db.query.domains.findMany({
      where: (d, { eq }) => eq(d.workspaceId, workspace.id),
    })

    return domains
  })
