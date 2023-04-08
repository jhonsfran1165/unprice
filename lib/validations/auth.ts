import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// ------------------------------------------------------------

const email = z.string().min(1, { message: "Email is required" }).email({
  message: "Must be a valid email",
})

const password = z
  .string()
  .min(6, { message: "Password must be at least 6 characters" })

const confirmPassword = z
  .string()
  .min(6, { message: "Password must be at least 6 characters" })

export const authLoginValidationSchema = z.object({
  email,
  password,
})

export const authRegisterValidationSchema = z
  .object({
    email,
    password,
    confirmPassword,
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Password don't match",
  })

export const authAccountExistValidationSchema = z.object({
  email,
})

export type authRegisterValidationType = z.infer<
  typeof authRegisterValidationSchema
>
export type authLoginValidationType = z.infer<typeof authLoginValidationSchema>
