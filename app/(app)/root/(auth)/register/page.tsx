"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { SubmitHandler, useForm } from "react-hook-form"

import {
  authRegisterValidationSchema,
  type authRegisterValidationType,
} from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSupabase } from "@/components/auth/supabase-provider"
import BlurImage from "@/components/shared/blur-image"
import LoadingDots from "@/components/shared/loading/loading-dots"

export default function Register() {
  const [SignUpClicked, setSignUpClicked] = useState(false)
  const [alreadyExistAccount, setAlreadyExistAccount] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const router = useRouter()
  const { supabase } = useSupabase()

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<authRegisterValidationType>({
    resolver: zodResolver(authRegisterValidationSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit: SubmitHandler<authRegisterValidationType> = async ({
    email,
    password,
    confirmPassword,
  }) => {
    try {
      setSignUpClicked(true)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      router.push("/org?action=welcome")
    } catch (error) {
      console.log(error)
      if (error instanceof Error) {
        setAlreadyExistAccount(true)
        setErrorMessage(error.message)
      }
    } finally {
      setSignUpClicked(false)
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="rounded-2xl z-10 w-full max-w-md overflow-hidden border bg-background-bgSubtle shadow-sm shadow-background-solid">
        <div className="flex flex-col items-center justify-center space-y-3 border-b bg-primary-bg px-4 py-6 pt-8 text-center sm:px-16">
          <a href="https://dub.sh">
            <BlurImage
              src="/_static/logo.png"
              alt="Dub.sh logo"
              className="h-10 w-10 rounded-full"
              width={20}
              height={20}
            />
          </a>
          <h3 className="text-xl font-semibold">Sign Up</h3>
          <p className="text-sm">Use your email address to sign up.</p>
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
              <p className="pt-1 text-xs text-error-solid" role="alert">
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
              <p className="pt-1 text-xs text-error-solid" role="alert">
                {errors.password?.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="password" className="block text-xs">
              CONFIRM PASSWORD
            </Label>
            <Input
              {...register("confirmPassword")}
              type={"password"}
              id={"confirmPassword"}
              aria-invalid={errors.confirmPassword ? "true" : "false"}
              className="mt-1 block w-full"
            />
            {errors.confirmPassword && (
              <p className="pt-1 text-xs text-error-solid" role="alert">
                {errors.confirmPassword?.message}
              </p>
            )}
          </div>
          <Button
            disabled={SignUpClicked}
            title="Submit"
            type={"submit"}
            className="button-primary"
          >
            {SignUpClicked ? (
              <LoadingDots color="#808080" />
            ) : (
              <p className="text-primary-textContrast">Sign Up</p>
            )}
          </Button>
          {alreadyExistAccount ? (
            <p className="text-center text-sm font-normal text-error-solid">
              Account already exits.{" "}
              <Link href="/login" className="font-semibold">
                Sign In
              </Link>{" "}
              instead?
            </p>
          ) : (
            <p className="text-center text-sm font-normal">
              Already registered?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary-textContrast"
              >
                Sign In
              </Link>{" "}
              to your account.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
