"use client"

import ThemedImage from "./themed-image"

export default function HeroImage() {
  return (
    <section aria-label="Hero Image of the website" className="flow-root">
      <div className="rounded-2xl bg-background/40 p-2 ring-1 ring-background/50 ring-inset">
        <div className="rounded-xl bg-background ring-1 ring-background/5">
          <ThemedImage
            lightSrc="/hero-light.webp"
            darkSrc="/hero-dark.webp"
            alt="A preview of the Database web app"
            width={2400}
            height={1600}
            className="rounded-xl shadow-2xl dark:shadow-indigo-600/10"
          />
        </div>
      </div>
    </section>
  )
}
