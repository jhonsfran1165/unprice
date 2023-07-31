import * as z from "zod"

export const analyticSchema = z.object({
  eventName: z.string().min(1, {
    message: "eventName is required",
  }),
  payload: z.object({}),
})
