"use client"

import Link from "next/link"

import { siteConfig } from "@/config/site"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import { buttonVariants } from "@/components/ui/button"

// TODO: introduce example framer motion
// https://www.josephcollicoat.com/articles/animating-text-with-the-intersection-observer-api-and-framer-motion

export default function IndexPage() {
  return (
    <MaxWidthWrapper>
      <section className="container grid items-center gap-6 pt-6 pb-8 md:py-10">
        <div className="flex flex-col items-start gap-2">
          <h1 className="mt-5 font-satoshi text-5xl font-extrabold leading-[1.15] sm:text-6xl sm:leading-[1.15]">
            Create amazing marketing pages blazingly fast
            <br />
            <br />
            <span className="bg-gradient-to-r from-amber-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent">
              BUILDERAI
            </span>
            <br />
            <span className="font-satoshi text-primary">BUILDERAI</span>
          </h1>
          <p className="max-w-[700px] text-lg sm:text-xl">
            Accessible and customizable components that you can copy and paste
            into your apps. Free. Open Source. And Next.js 13 Ready.
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href={siteConfig.links.dashboard}
            rel="noreferrer"
            className={buttonVariants({ size: "lg" })}
          >
            Dashboard
          </Link>
        </div>
      </section>
    </MaxWidthWrapper>
  )
}
