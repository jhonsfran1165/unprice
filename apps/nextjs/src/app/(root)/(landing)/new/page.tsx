import Cta from "~/components/landing/Cta"
import Features from "~/components/landing/Features"
import CodeExample from "~/components/landing/code-example"
import { Global } from "~/components/landing/global"
import Hero from "~/components/landing/hero"
import LogoCloud from "~/components/landing/logo-cloud"

export default function Home() {
  return (
    <main className="flex flex-col overflow-hidden pb-28">
      <Hero />
      <LogoCloud />
      <Global />
      <CodeExample />
      <Features />
      <Cta />
    </main>
  )
}
