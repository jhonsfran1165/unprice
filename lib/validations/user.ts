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

// const userLoginValidationSchema = z
// .object({
//   firstName: z.string().min(1, { message: "Firstname is required" }),
//   firstName: z.string().min(1, { message: "Firstname is required" }),
//   lastName: z.string().min(1, { message: "Lastname is required" }),
//   email: z.string().min(1, { message: "Email is required" }).email({
//     message: "Must be a valid email",
//   }),
//   password: z
//     .string()
//     .min(6, { message: "Password must be atleast 6 characters" }),
//   confirmPassword: z
//     .string()
//     .min(1, { message: "Confirm Password is required" }),
//   terms: z.literal(true, {
//     errorMap: () => ({ message: "You must accept Terms and Conditions" }),
//   }),
// })
// .refine((data) => data.password === data.confirmPassword, {
//   path: ["confirmPassword"],
//   message: "Password don't match",
// });
