"use client"

import { useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { SubmitHandler, useForm } from "react-hook-form"
import * as z from "zod"

import { Database } from "@/lib/supabase/database.types"
import { userNameSchema } from "@/lib/validations/user"
import { useSupabase } from "@/components/auth/supabase-provider"
import Meta from "@/components/layout/meta"
import Background from "@/components/shared/background"
import BlurImage from "@/components/shared/blur-image"
import LoadingDots from "@/components/shared/loading/loading-dots"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Inputs = {
  email: string
  password: string
}

type User = Database["public"]["Tables"]["profile"]["Row"]

interface UserNameFormProps extends React.HTMLAttributes<HTMLFormElement> {
  user: Pick<User, "id" | "full_name">
}

type FormData = z.infer<typeof userNameSchema>

export default function Login() {
  const [signInClicked, setSignInClicked] = useState(false)
  const [noSuchAccount, setNoSuchAccount] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [buttonText, setButtonText] = useState("Send magic link")

  const { supabase } = useSupabase()

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<Inputs>({
    resolver: zodResolver(userNameSchema),
    defaultValues: {
      email: "",
    },
  })
  const onSubmit: SubmitHandler<Inputs> = async ({ email, password }) => {
    try {
      setSignInClicked(true)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log(data)

      if (error) throw error
      alert("Check your email for the login link!")
    } catch (error) {
      if (error instanceof Error) {
        setNoSuchAccount(true)
        setErrorMessage(error.message)
      }
    } finally {
      setSignInClicked(false)
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <Meta title="Sign in to Dub" />
      <Background />
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center sm:px-16">
          <a href="https://dub.sh">
            <BlurImage
              src="/_static/logo.png"
              alt="Dub.sh logo"
              className="h-10 w-10 rounded-full"
              width={20}
              height={20}
            />
          </a>
          <h3 className="text-xl font-semibold">Sign In</h3>
          <p className="text-sm text-gray-500">
            Use your email address to sign in.
          </p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 sm:px-16"
        >
          {errorMessage ? (
            <p className="text-center text-sm text-red-500">{errorMessage}</p>
          ) : (
            <p className="text-center text-sm text-red-500 text-opacity-0">
              {" "}
              No errors
            </p>
          )}
          <div>
            <Label htmlFor="email" className="block text-xs text-gray-600">
              EMAIL ADDRESS
            </Label>
            <Input
              type={"email"}
              {...register("email", {
                pattern:
                  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                required: "Email Address is required",
              })}
              aria-invalid={errors.email ? "true" : "false"}
              className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
            />
            {errors.email && (
              <p className="text-sm text-gray-600" role="alert">
                {errors.email?.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="password" className="block text-xs text-gray-600">
              PASSWORD
            </Label>
            <Input
              type={"password"}
              {...register("password", {
                required: "Passwrod is required",
              })}
              aria-invalid={errors.password ? "true" : "false"}
              className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-sm"
            />
            {errors.password && (
              <p className="text-sm text-gray-600" role="alert">
                {errors.password?.message}
              </p>
            )}
          </div>
          <Button
            disabled={signInClicked}
            title="Submit"
            onClick={handleSubmit(onSubmit)}
            className={`${
              signInClicked
                ? "cursor-not-allowed border-gray-200 bg-gray-100"
                : "border-black bg-black text-white hover:bg-white hover:text-black"
            } flex h-10 w-full items-center justify-center rounded-md border text-sm transition-all focus:outline-none`}
          >
            {signInClicked ? (
              <LoadingDots color="#808080" />
            ) : (
              <p>{buttonText}</p>
            )}
          </Button>
          {noSuchAccount ? (
            <p className="text-center text-sm text-red-500">
              No such account.{" "}
              <Link
                href="/auth/register"
                className="font-semibold text-red-600"
              >
                Sign up
              </Link>{" "}
              instead?
            </p>
          ) : (
            <p className="text-center text-sm text-gray-600">
              Already registered?{" "}
              <Link href="/auth/login" className="font-semibold text-gray-800">
                Sign in
              </Link>{" "}
              to your account.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
