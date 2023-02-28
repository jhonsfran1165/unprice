"use client"

import React from "react"

import { Boundary } from "@/components/shared/boundary"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import { Button } from "@/components/ui/button"
import "@/styles/globals.css"
import { inter, satoshi } from "@/assets/fonts"
import { Inter } from "@next/font/google"
import localFont from "@next/font/local"

import { cn } from "@/lib/utils"
import BackGround from "@/components/shared/background"
import { TailwindIndicator } from "@/components/shared/tailwind-indicator"
import AppProviders from "./providers"

export default function GlobalError({ error, reset }: any) {
  React.useEffect(() => {
    console.log("logging error:", error)
  }, [error])

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={cn(satoshi.variable, inter.variable)}>
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
      </body>
    </html>
  )
}
