"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { SubmitHandler, useForm } from "react-hook-form"

import {
  authLoginValidationSchema,
  type authLoginValidationType,
} from "@/lib/validations/auth"
import { useSupabase } from "@/components/auth/supabase-provider"
import BlurImage from "@/components/shared/blur-image"
import LoadingDots from "@/components/shared/loading/loading-dots"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Login() {
  const [signInClicked, setSignInClicked] = useState(false)
  const [noSuchAccount, setNoSuchAccount] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const router = useRouter()

  const { supabase } = useSupabase()

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<authLoginValidationType>({
    resolver: zodResolver(authLoginValidationSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit: SubmitHandler<authLoginValidationType> = async ({
    email,
    password,
  }) => {
    try {
      setSignInClicked(true)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push("/")
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
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border shadow-sm shadow-background-solid bg-background-bgSubtle">
        <div className="flex flex-col items-center justify-center bg-primary-bg space-y-3 border-b px-4 py-6 pt-8 text-center sm:px-16">
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
          <p className="text-sm">Use your email address to sign in.</p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col space-y-4 px-4 py-8 sm:px-16"
        >
          {errorMessage ? (
            <p className="text-center text-sm text-error-solid">
              {errorMessage}
            </p>
          ) : (
            <p className="text-center text-sm text-transparent"> No errors</p>
          )}
          <div>
            <Label htmlFor="email" className="block text-xs">
              EMAIL ADDRESS
            </Label>
            <Input
              {...register("email")}
              type={"email"}
              id={"email"}
              aria-invalid={errors.email ? "true" : "false"}
              className="mt-1 block w-full"
            />
            {errors.email && (
              <p className="text-xs pt-1 text-error-solid" role="alert">
                {errors.email?.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="password" className="block text-xs">
              PASSWORD
            </Label>
            <Input
              {...register("password")}
              type={"password"}
              id={"password"}
              aria-invalid={errors.password ? "true" : "false"}
              className="mt-1 block w-full"
            />
            {errors.password && (
              <p className="text-xs pt-1 text-error-solid" role="alert">
                {errors.password?.message}
              </p>
            )}
          </div>
          <Button
            disabled={signInClicked}
            title="Submit"
            type={"submit"}
            className="bg-primary-bg active:bg-primary-bgActive hover:bg-primary-bgHover border border-primary-border hover:border-primary-borderHover"
          >
            {signInClicked ? (
              <LoadingDots color="#808080" />
            ) : (
              <p className="text-primary-textContrast">Sign In</p>
            )}
          </Button>
          {noSuchAccount ? (
            <p className="text-center text-sm font-normal text-error-solid">
              No such account.{" "}
              <Link href="/register" className="font-semibold">
                Sign up
              </Link>{" "}
              instead?
            </p>
          ) : (
            <p className="text-center text-sm font-normal">
              No registered?{" "}
              <Link
                href="/register"
                className="font-semibold text-primary-textContrast"
              >
                Sign up
              </Link>{" "}
              with your email.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
