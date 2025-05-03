import { LazyMotion, domAnimation, m } from "framer-motion"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Balancer } from "react-wrap-balancer"
import { StripePaymentConfigForm } from "../../[projectSlug]/settings/payment/_components/stripe-payment-config-form"

export default function CreatePaymentConfig() {
  const router = useRouter()
  const params = useParams()
  const workspaceSlug = params.workspaceSlug as string

  useEffect(() => {
    if (!workspaceSlug) {
      router.push("/onboarding")
    }
  }, [workspaceSlug, router])

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
          className="flex flex-col rounded-xl bg-background/60 p-8"
        >
          <m.h1
            className="mb-4 font-bold text-2xl transition-colors sm:text-3xl"
            variants={{
              hidden: { opacity: 0, x: 250 },
              show: {
                opacity: 1,
                x: 0,
                transition: { duration: 0.4, type: "spring" },
              },
            }}
          >
            <Balancer>{`Next, let's create a payment config for your app`}</Balancer>
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
            <StripePaymentConfigForm
              paymentProvider="stripe"
              onSuccess={() => {
                const searchParams = new URLSearchParams(window.location.search)
                searchParams.set("step", "create-api-key")
                router.push(`/${workspaceSlug}/onboarding?${searchParams.toString()}`)
              }}
            />
          </m.div>
        </m.div>
      </m.div>
    </LazyMotion>
  )
}
