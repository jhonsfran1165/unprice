"use server"

import { signIn } from "@unprice/auth/server"

export async function loginWithCredentials({
  email,
  password,
}: { email: string; password: string }) {
  try {
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (!res || res.error) {
      return {
        success: false,
        message: res.error?.message ?? "Invalid credentials",
      }
    }

    return {
      success: true,
      message: "Login successful",
      redirect: "/",
    }
  } catch (error) {
    const err = error as Error & { cause: { err: Error } }

    return {
      success: false,
      message: err.cause.err.message ?? "Invalid credentials",
    }
  }
}
