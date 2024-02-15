import type { Route } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@builderai/auth/server"

import { SignInGithub } from "./github-signin"

export const runtime = "edge"

export default async function AuthenticationPage() {
  const session = await auth()

  if (session?.user?.id) {
    redirect("/")
  }
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
      </div>
      <div className="grid gap-6">
        <SignInGithub />
      </div>

      <p className="px-8 text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <Link
          href={"/terms" as Route}
          className="underline underline-offset-4 hover:text-primary"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href={"/privacy" as Route}
          className="underline underline-offset-4 hover:text-primary"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}
