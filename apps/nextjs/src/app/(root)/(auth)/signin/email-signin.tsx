"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"

import { useSignIn, useSignUp } from "@builderai/auth"
import { Button } from "@builderai/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@builderai/ui/form"
import { Spinner } from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"
import { useToast } from "@builderai/ui/use-toast"

import { useZodForm } from "~/lib/zod-form"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(4, "Name must be at least 5 characters"),
})

export type LoginForm = z.infer<typeof loginSchema>

export function EmailSignIn() {
  const [isLoading, setIsLoading] = React.useState(false)

  const { signIn, isLoaded: signInLoaded, setActive } = useSignIn()
  const { signUp, isLoaded: signUpLoaded } = useSignUp()
  const router = useRouter()
  const { toast } = useToast()

  // TODO: handle errors from clerk
  const signInWithLink = async (data: LoginForm) => {
    const { email, username } = data

    if (!signInLoaded) return null

    // the catch here prints out the error.
    // if the user doesn't exist we will return a 422 in the network response.
    // so push that to the sign up.
    setIsLoading(true)
    await signIn
      .create({
        identifier: email,
      })
      .catch((error) => {
        console.log("sign-in error", JSON.stringify(error))
      })

    const firstFactor = signIn.supportedFirstFactors.find(
      (f) => f.strategy === "email_link"
      // This cast shouldn't be necessary but because TypeScript is dumb and can't infer it.
    ) as { emailAddressId: string } | undefined

    if (firstFactor) {
      const magicFlow = signIn.createEmailLinkFlow()

      setIsLoading(false)
      toast({
        title: "Email Sent",
        description: "Check your inbox for a verification email.",
      })

      const response = await magicFlow
        .startEmailLinkFlow({
          emailAddressId: firstFactor.emailAddressId,
          redirectUrl: `${window.location.origin}/`,
        })
        .catch((error) => {
          console.log("sign-in error", JSON.stringify(error))
          toast({
            variant: "destructive",
            title: "Error",
            description: "Something went wrong, please try again.",
          })
        })

      const verification = response?.firstFactorVerification
      if (verification?.status === "expired") {
        toast({
          variant: "destructive",
          title: "Link Expired",
          description: "Link expired, please try again.",
        })
      }

      magicFlow.cancelEmailLinkFlow()

      if (response?.status === "complete") {
        await setActive({ session: response.createdSessionId })
        router.push(`/`)
      }
    } else {
      if (!signUpLoaded) return null

      await signUp.create({
        emailAddress: email,
        username: username,
      })
      const { startEmailLinkFlow } = signUp.createEmailLinkFlow()

      setIsLoading(false)

      toast({
        title: "Email Sent",
        description: "Check your inbox for a verification email.",
      })

      const response = await startEmailLinkFlow({
        redirectUrl: `${window.location.origin}/`,
      }).catch((error) => {
        console.log("sign-in error", JSON.stringify(error))
        toast({
          variant: "destructive",
          title: "Error",
          description: "Something went wrong, please try again.",
        })
      })

      if (response?.status === "complete") {
        await setActive({ session: response.createdSessionId })
        router.push(`/`)
        return
      }
    }
  }

  const form = useZodForm({
    schema: loginSchema,
    defaultValues: {
      email: "",
      username: "",
    },
  })

  return (
    <Form {...form}>
      <form
        className="grid gap-2"
        onSubmit={form.handleSubmit((data: LoginForm) => {
          void signInWithLink(data)
        })}
      >
        <div className="grid gap-1">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="name@example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="username" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="button-primary" disabled={isLoading}>
          {isLoading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
          Sign In with Email
        </Button>
      </form>
    </Form>
  )
}
