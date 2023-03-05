"use client"

import { useEffect, useState } from "react"

import { useStore } from "@/lib/stores/layout"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"

export default function HeaderContext() {
  const { contextHeader } = useStore()
  const [title, setTitle] = useState(contextHeader)

  useEffect(() => {
    setTitle(contextHeader)
  }, [contextHeader])

  return (
    <section>
      <div className="flex h-36 items-center border-b border-base-skin-200 bg-base-skin-900 z-30">
        <MaxWidthWrapper className="max-w-screen-2xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl text-base-text pl-5">{title}</h1>
          </div>
        </MaxWidthWrapper>
      </div>
    </section>
  )
}
