"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { SubmitHandler, useForm } from "react-hook-form"

import { cn } from "@/lib/utils"
import {
  authRegisterValidationSchema,
  type authRegisterValidationType,
} from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/auth/supabase-provider"
import { Icons } from "@/components/shared/icons"

interface RegisterFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function RegisterForm({ className, ...props }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false)

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
  }) => {
    try {
      setIsLoading(true)

      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error
      router.push("/org?action=welcome")
    } catch (error) {
      toast({
        title: "Register error",
        description: error.message,
        className: "danger",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form id="register-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              {...register("email")}
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              aria-invalid={errors.email ? "true" : "false"}
            />
            {errors.email && (
              <p className="pl-1 pt-1 text-xs text-error-solid" role="alert">
                {errors.email?.message}
              </p>
            )}
          </div>
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="password">
              Password
            </Label>
            <Input
              {...register("password")}
              id="password"
              placeholder="password"
              type="password"
              disabled={isLoading}
              aria-invalid={errors.password ? "true" : "false"}
            />
            {errors.password && (
              <p className="pl-1 pt-1 text-xs text-error-solid" role="alert">
                {errors.password?.message}
              </p>
            )}
          </div>
          <Button
            disabled={isLoading}
            form="register-form"
            type="submit"
            className="font-semibold text-black"
          >
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sign Up with Email
          </Button>
        </div>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background-base px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        type="button"
        className="button-ghost"
        disabled={isLoading}
      >
        {isLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.gitHub className="mr-2 h-4 w-4" />
        )}{" "}
        Github
      </Button>
    </div>
  )
}
