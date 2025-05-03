"use client"

import { Typography } from "@unprice/ui/typography"
import { LazyMotion, domAnimation, m } from "framer-motion"
import { Link } from "next-view-transitions"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useTransition } from "react"

export default function Done(props: { workspaceSlug: string }) {
  const router = useRouter()
  const search = useSearchParams()
  const step = search.get("step")
  const projectSlug = search.get("projectSlug")
  const apiKey = search.get("apiKey")

  const [_, startTransition] = useTransition()
  useEffect(() => {
    if (step === "done") {
      setTimeout(() => {
        startTransition(() => {
          router.push(`/${props.workspaceSlug}/${projectSlug}`)
          router.refresh()
        })
      }, 1500)
    }
  }, [projectSlug, props.workspaceSlug, router, step, apiKey])

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className="flex h-full w-full flex-col items-center justify-center p-8"
        exit={{ opacity: 0, scale: 0.95 }}
        initial={{ background: "transparent" }}
        animate={{ background: "var(--background)" }}
        transition={{ duration: 0.3, type: "spring" }}
      >
        <m.div
          variants={{
            hidden: { opacity: 0, x: 250 },
            show: {
              opacity: 1,
              x: 0,
              transition: { duration: 0.4, type: "spring" },
            },
          }}
          initial="hidden"
          animate="show"
          className="flex flex-col space-y-4 rounded-xl bg-background/60 p-8"
        >
          <Typography variant="h2" className="transition-colors sm:text-3xl">
            You are all set!
          </Typography>
          <Typography
            variant="p"
            className="max-w-md text-muted-foreground transition-colors sm:text-lg"
          >
            Congratulations, you have successfully created your first app. Check out the{" "}
            <Link href="/docs">docs</Link> to learn more on how to use the platform.
          </Typography>
          <Typography variant="p">You will be redirected to your app shortly.</Typography>
        </m.div>
      </m.div>
    </LazyMotion>
  )
}
