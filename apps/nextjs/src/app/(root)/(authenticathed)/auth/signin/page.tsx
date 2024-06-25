import type { Route } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { getSession } from "@builderai/auth/server-rsc"

import { SignInGithub } from "./github-signin"

export default async function AuthenticationPage() {
  const session = await getSession()

  if (session?.user?.id) {
    redirect("/")
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
      </div>
      <div className="grid gap-6">
        <SignInGithub />
      </div>

      <p className="text-muted-foreground px-8 text-center text-sm">
        By clicking continue, you agree to our{" "}
        <Link href={"/terms" as Route} className="hover:text-primary underline underline-offset-4">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href={"/privacy" as Route}
          className="hover:text-primary underline underline-offset-4"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}
