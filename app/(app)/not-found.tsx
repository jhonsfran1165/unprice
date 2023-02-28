import Link from "next/link"

import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import { buttonVariants } from "@/components/ui/button"

export default function NotFound() {
  return (
    <MaxWidthWrapper>
      <section className="container grid items-center gap-6 pt-6 pb-8 md:py-10">
        <div className="flex max-w-[980px] flex-col items-start gap-2">
          <h1 className="mt-5 font-satoshi text-5xl font-extrabold leading-[1.15] text-black sm:text-6xl sm:leading-[1.15]">
            404 Page not Found :(
            <br />
          </h1>
          <p className="max-w-[700px] text-lg text-slate-700 dark:text-slate-400 sm:text-xl">
            This page was not found.
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/home"
            rel="noreferrer"
            className={buttonVariants({ size: "lg" })}
          >
            Home
          </Link>
        </div>
      </section>
    </MaxWidthWrapper>
  )
}
