import { useEffect, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { domAnimation, LazyMotion, m } from "framer-motion"

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
          router.push(`${props.workspaceSlug}/${projectSlug}/overview`)
          router.refresh()
        })
      }, 2000)
    }
  }, [projectSlug, props.workspaceSlug, router, step, apiKey])

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className="shadox-xl flex h-full w-full flex-col items-center justify-center bg-opacity-60 p-8"
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
          className="bg-background/60 flex flex-col space-y-4 rounded-xl p-8"
        >
          <h1 className="text-2xl font-bold transition-colors sm:text-3xl">
            You are all set!
          </h1>
          <p className="max-w-md text-muted-foreground transition-colors sm:text-lg">
            Congratulations, you have successfully created your first project.
            Check out the <Link href="/docs">docs</Link> to learn more on how to
            use the platform.
          </p>
          <p className="text-sm text-muted-foreground">
            You will be redirected to your project momentarily.
          </p>
        </m.div>
      </m.div>
    </LazyMotion>
  )
}
