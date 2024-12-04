import { workspaceInsertBase, workspaceSelectBase } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProcedure } from "../../../trpc"
import { createWorkspace } from "../../../utils/shared"

export const create = protectedProcedure
  .input(
    workspaceInsertBase.required({
      name: true,
      unPriceCustomerId: true,
    })
  )
  .output(
    z.object({
      workspace: workspaceSelectBase,
    })
  )
  .mutation(async (opts) => {
    const newWorkspace = await createWorkspace({
      input: opts.input,
      ctx: opts.ctx,
    })

    return {
      workspace: newWorkspace,
    }
  })
