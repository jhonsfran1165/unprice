"use client"

import { AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"

const Intro = dynamic(() => import("./intro"), {
  ssr: false,
})
const Done = dynamic(() => import("./done"), {
  ssr: false,
})
const CreateProject = dynamic(() => import("./create-project"), {
  ssr: false,
})

// TODO: configure onboarding - create api key is creating a new api key in the admin project because
// the cookie is not set properly when the path is /onboarding
// const CreateApiKey = dynamic(() => import("./create-api-key"), {
//   ssr: false,
// })

export function Onboarding(props: { workspaceSlug: string }) {
  const search = useSearchParams()
  const step = search.get("step")

  return (
    <div className="mx-auto flex h-[calc(100vh-14rem)] w-full max-w-screen-sm flex-col items-center">
      <AnimatePresence mode="wait">
        {!step && <Intro key="intro" />}
        {step === "create-project" && <CreateProject />}
        {/* {step === "create-api-key" && <CreateApiKey />} */}
        {step === "done" && <Done workspaceSlug={props.workspaceSlug} />}
      </AnimatePresence>
    </div>
  )
}
