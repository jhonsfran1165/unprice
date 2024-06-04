import { LazyMotion, domAnimation, m } from "framer-motion"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { Balancer } from "react-wrap-balancer"

const CreateApiKeyForm = dynamic(
  () => import("../../[projectSlug]/apikeys/_components/create-api-key-form"),
  {
    ssr: false,
  }
)

export default function CreateApiKey() {
  const router = useRouter()
  const projectSlug = useSearchParams().get("projectSlug")

  useEffect(() => {
    if (!projectSlug) {
      router.push("/onboarding")
    }
  }, [projectSlug, router])

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className="flex h-full w-full flex-col items-center justify-center"
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, type: "spring" }}
      >
        <m.div
          variants={{
            show: {
              transition: {
                staggerChildren: 0.2,
              },
            },
          }}
          initial="hidden"
          animate="show"
          className="bg-background/60 flex flex-col rounded-xl p-8"
        >
          <m.h1
            className="mb-4 text-2xl font-bold transition-colors sm:text-3xl"
            variants={{
              hidden: { opacity: 0, x: 250 },
              show: {
                opacity: 1,
                x: 0,
                transition: { duration: 0.4, type: "spring" },
              },
            }}
          >
            <Balancer>{`Next, let's create an API key for your project`}</Balancer>
          </m.h1>
          <m.div
            variants={{
              hidden: { opacity: 0, x: 100 },
              show: {
                opacity: 1,
                x: 0,
                transition: { duration: 0.4, type: "spring" },
              },
            }}
          >
            <CreateApiKeyForm
              projectSlug={projectSlug!}
              onSuccess={(key: string) => {
                const searchParams = new URLSearchParams(window.location.search)
                searchParams.set("step", "done")
                searchParams.set("apiKey", key)
                router.push(`/onboarding?${searchParams.toString()}`)
              }}
            />
          </m.div>
        </m.div>
      </m.div>
    </LazyMotion>
  )
}
