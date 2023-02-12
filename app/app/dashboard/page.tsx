"use client"

import Link from "next/link"

import { siteConfig } from "@/config/site"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import { buttonVariants } from "@/components/ui/button"

export default function IndexPage() {
  return (
    <MaxWidthWrapper className="pb-10">
      <section className="container grid items-center gap-6 pt-6 pb-8 md:py-10">
        <div className="flex max-w-[980px] flex-col items-start gap-2">
          <h1 className="mt-5 font-satoshi text-5xl font-extrabold leading-[1.15] text-black sm:text-6xl sm:leading-[1.15]">
            Testing from Dashboard
          </h1>
        </div>
      </section>
    </MaxWidthWrapper>
  )
}
