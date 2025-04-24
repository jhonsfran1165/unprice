"use client"
import type { FunctionComponent } from "react"
import { Globe } from "./globe"

export const Global: FunctionComponent = () => {
  const features = [
    {
      name: "Global low latency",
      description: "Tier caching for low-latency global access.",
    },
    {
      name: "Subscription billing",
      description: "Subscription machines for global billing, no matter where you are.",
    },
    {
      name: "Analytics",
      description: "Powered by ClickHouse, the fastest analytics database.",
    },
  ]

  return (
    <div className="px-3">
      <section
        aria-labelledby="global-database-title"
        className="relative mx-auto mt-28 flex w-full max-w-6xl flex-col items-center justify-center overflow-hidden rounded-3xl bg-background pt-24 md:mt-40"
      >
        <div className="absolute top-[17rem] size-[40rem] rounded-full bg-primary-bgHover blur-3xl md:top-[20rem]" />
        <div className="z-10 inline-block rounded-lg border border-primary-border bg-primary-bg px-3 py-1.5 font-semibold text-primary-text uppercase leading-4 tracking-tight sm:text-sm">
          <span>Made for the cloud</span>
        </div>
        <h2
          id="global-database-title"
          className="z-10 mt-6 inline-block px-2 text-center font-bold text-5xl text-background-textContrast tracking-tighter md:text-8xl"
        >
          The market is the <br /> world
        </h2>
        <Globe className="absolute top-[1rem] z-20 aspect-square size-full max-w-fit sm:top-[12rem] md:top-[15rem]" />
        <div className="-mt-32 md:-mt-36 z-20 h-[36rem] w-full overflow-hidden">
          <div className="absolute bottom-0 h-3/5 w-full bg-gradient-to-b from-transparent via-background-base to-background-base" />
          <div className="absolute inset-x-6 bottom-12 m-auto max-w-4xl md:top-2/3">
            <div className="grid grid-cols-1 gap-x-10 gap-y-6 rounded-lg border border-white/[3%] bg-white/[1%] px-6 py-6 shadow-xl backdrop-blur md:grid-cols-3 md:p-8">
              {features.map((item) => (
                <div key={item.name} className="flex flex-col gap-2">
                  <h3 className="whitespace-nowrap bg-gradient-to-b from-background-textContrast to-background-textContrast bg-clip-text font-semibold text-lg text-transparent md:text-xl">
                    {item.name}
                  </h3>
                  <p className="text-background-textContrast/40 text-sm leading-6">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
