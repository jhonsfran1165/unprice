import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

export const userLoginValidationSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }).email({
    message: "Must be a valid email",
  }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
})

export type userLoginValidationType = z.infer<typeof userLoginValidationSchema>
