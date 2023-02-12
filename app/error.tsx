"use client"

import React from "react"

import { Boundary } from "@/components/shared/boundary"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import { Button } from "@/components/ui/button"

export default function Error({ error, reset }: any) {
  React.useEffect(() => {
    console.log("logging error:", error)
  }, [error])

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <MaxWidthWrapper>
        <Boundary labels={["Home page Error UI"]} color="pink">
          <div className="space-y-4">
            <div className="text-sm text-vercel-pink">
              <strong className="font-bold">Error:</strong> {error?.message}
            </div>
            <div>
              <Button onClick={() => reset()}>Try Again</Button>
            </div>
          </div>
        </Boundary>
      </MaxWidthWrapper>
    </div>
  )
}
