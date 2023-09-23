"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useSignIn, useSignUp } from "@builderai/auth"
import { Button } from "@builderai/ui/button"
import * as Icons from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"
import { useToast } from "@builderai/ui/use-toast"

export function EmailSignIn() {
  const [isLoading, setIsLoading] = React.useState(false)

  const { signIn, isLoaded: signInLoaded, setActive } = useSignIn()
  const { signUp, isLoaded: signUpLoaded } = useSignUp()
  const router = useRouter()
  const { toast } = useToast()

  // TODO: handle errors from clerk
  const signInWithLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const email = new FormData(e.currentTarget).get("email")
    const username = new FormData(e.currentTarget).get("username")
    if (
      !signInLoaded ||
      typeof email !== "string" ||
      typeof username !== "string"
    )
      return null

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
      const magicFlow = signIn.createMagicLinkFlow()

      setIsLoading(false)
      toast({
        title: "Email Sent",
        description: "Check your inbox for a verification email.",
      })
      const response = await magicFlow
        .startMagicLinkFlow({
          emailAddressId: firstFactor.emailAddressId,
          redirectUrl: `${window.location.origin}/`,
        })
        .catch(() => {
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

      magicFlow.cancelMagicLinkFlow()
      if (response?.status === "complete") {
        await setActive({ session: response.createdSessionId })
        router.push(`/dashboard`)
      }
    } else {
      if (!signUpLoaded) return null

      await signUp.create({
        emailAddress: email,
        username: username,
      })
      const { startMagicLinkFlow } = signUp.createMagicLinkFlow()

      setIsLoading(false)

      toast({
        title: "Email Sent",
        description: "Check your inbox for a verification email.",
      })

      const response = await startMagicLinkFlow({
        redirectUrl: `${window.location.origin}/`,
      })
        .catch((error) => {
          console.log(error)
          toast({
            variant: "destructive",
            title: "Error",
            description: "Something went wrong, please try again.",
          })
        })
        .then((res) => res)

      if (response?.status === "complete") {
        await setActive({ session: response.createdSessionId })
        router.push(`/dashboard`)
        return
      }
    }
  }

  // TODO: improve this
  return (
    <form className="grid gap-2" onSubmit={signInWithLink}>
      <div className="grid gap-1">
        <Input
          name="email"
          placeholder="name@example.com"
          type="email"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          className="bg-background"
          required
        />
        <Input
          name="username"
          placeholder="username"
          type="text"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          className="bg-background"
          required
        />
      </div>
      <Button className="button-primary" disabled={isLoading}>
        {isLoading && <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />}
        Sign In with Email
      </Button>
    </form>
  )
}
