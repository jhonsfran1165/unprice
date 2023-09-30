"use client"

import { Show } from "@legendapp/state/react"
import { AnimatePresence } from "framer-motion"

import MaxWidthWrapper from "~/components/max-width-wrapper"
import { layoutState } from "~/stores/layout"

export default function HeaderContext() {
  const contextHeader = layoutState.contextHeader.use()
  const canRenderHeaderContext = layoutState.canRenderHeaderContext.use()

  return (
    <Show
      if={canRenderHeaderContext && contextHeader}
      else={null}
      wrap={AnimatePresence}
    >
      {() => (
        <section>
          <div className="z-30 flex h-36 items-center border-b bg-background text-background-textContrast">
            <MaxWidthWrapper className="max-w-screen-2xl">
              <div className="flex items-center justify-between">
                <h1 className="pl-5 text-2xl">{contextHeader}</h1>
              </div>
            </MaxWidthWrapper>
          </div>
        </section>
      )}
    </Show>
  )
}
