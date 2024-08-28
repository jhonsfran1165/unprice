import { TRPCError } from "@trpc/server"
import { customerSelectSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProcedure } from "../../../trpc"

export const getById = protectedProcedure
  .input(customerSelectSchema.pick({ id: true }))
  .output(z.object({ customer: customerSelectSchema }))
  .query(async (opts) => {
    const { id } = opts.input

    const customerData = await opts.ctx.db.query.customers.findFirst({
      where: (customer, { eq }) => eq(customer.id, id),
    })

    if (!customerData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Customer not found",
      })
    }

    return {
      customer: customerData,
    }
  })
