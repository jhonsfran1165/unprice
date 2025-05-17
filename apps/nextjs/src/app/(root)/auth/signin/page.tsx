import type { Route } from "next"
import { Link } from "next-view-transitions"
import { redirect } from "next/navigation"

import { getSession } from "@unprice/auth/server-rsc"

import { Typography } from "@unprice/ui/typography"
import { SignInGithub } from "./github-signin"
import { SignInGoogle } from "./google-signin"
export default async function AuthenticationPage() {
  const session = await getSession()

  if (session?.user?.id) {
    redirect("/")
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <Typography variant="h2">Create an account</Typography>
      </div>
      <div className="flex w-full items-center justify-between gap-2">
        <SignInGithub className="flex-1" />
        <SignInGoogle className="flex-1" />
      </div>

      <Typography variant="p" className="px-8 text-center">
        By clicking continue, you agree to our{" "}
        <Link href={"/terms" as Route} className="underline underline-offset-4 hover:text-primary">
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
      </Typography>
    </div>
  )
}
