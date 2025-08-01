"use client"

import { Typography } from "@unprice/ui/typography"
import { LazyMotion, domAnimation, m } from "framer-motion"
import { useParams, useRouter } from "next/navigation"
import { Balancer } from "react-wrap-balancer"
import { ProjectForm } from "../../_components/project-form"

export default function CreateProject() {
  const router = useRouter()
  const workspaceSlug = useParams().workspaceSlug as string

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className="my-auto flex h-full w-full flex-col items-center justify-center"
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
            <Balancer>Let's start off by creating your first project</Balancer>
          </m.h1>
          <m.div
            className="mb-8"
            variants={{
              hidden: { opacity: 0, x: 100 },
              show: {
                opacity: 1,
                x: 0,
                transition: { duration: 0.4, type: "spring" },
              },
            }}
          >
            <Typography variant="p">
              An project is a representation of your product. It can be a website, a mobile project,
              or a desktop project, where you can offer your plans and features to your customers.
            </Typography>
          </m.div>
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
            <ProjectForm
              onSuccess={({ slug }) => {
                const searchParams = new URLSearchParams(window.location.search)
                searchParams.set("step", "create-payment-config")
                searchParams.set("projectSlug", slug)
                router.push(`/${workspaceSlug}/onboarding?${searchParams.toString()}`)
              }}
              defaultValues={{
                defaultCurrency: "USD",
                timezone: "UTC",
                name: "Acme project",
                url: "https://acme.com",
              }}
            />
          </m.div>
        </m.div>
      </m.div>
    </LazyMotion>
  )
}
