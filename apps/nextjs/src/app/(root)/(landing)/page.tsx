import { Balancer } from "react-wrap-balancer"

import { buttonVariants } from "@unprice/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import { GitHub } from "@unprice/ui/icons"
import { cn } from "@unprice/ui/utils"
import { marketingFeatures, techStack } from "~/constants/config"
import { siteConfig } from "~/constants/layout"

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center pt-48">
      <div className="z-10 min-h-[50vh] w-full max-w-4xl px-5 xl:px-0">
        {/* <a
          href="https://twitter.com/steventey/status/1613928948915920896"
          target="_blank"
          rel="noreferrer"
          className="mx-auto mb-5 flex max-w-fit animate-fade-up items-center justify-center space-x-2 overflow-hidden rounded-full bg-sky-100 px-7 py-2 transition-colors hover:bg-sky-200"
        >
          <Icons.twitter className="h-5 w-5 text-sky-500" />
          <p className="text-sm font-semibold text-sky-500">
            Introducing Acme Corp
          </p>
        </a> */}
        <h1
          className="animate-fade-up bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-center font-bold text-transparent tracking-[-0.02em] opacity-0 drop-shadow-sm md:text-7xl/[5rem]"
          style={{ animationDelay: "0.20s", animationFillMode: "forwards" }}
        >
          <Balancer>Unprice pricing platform for modern saas.</Balancer>
        </h1>
        <p
          className="mt-6 animate-fade-up text-center text-muted-foreground/80 opacity-0 md:text-xl"
          style={{ animationDelay: "0.30s", animationFillMode: "forwards" }}
        >
          <Balancer>
            Product market fit is a lie, everything starts with price. Product-market-price fit is
            the new normal. Unprice is the platform that helps you find the right price for your
            product.
          </Balancer>
        </p>
        <div
          className="mx-auto mt-6 flex animate-fade-up items-center justify-center space-x-5 opacity-0"
          style={{ animationDelay: "0.40s", animationFillMode: "forwards" }}
        >
          <a
            className={cn(buttonVariants({ variant: "primary" }))}
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHub className="mr-1 h-4 w-4" />
            <span>Star on GitHub</span>
          </a>
        </div>
      </div>

      <div className="w-full max-w-screen-lg animate-fade-up gap-5 border-t p-5 xl:px-0">
        <h2 className="pt-4 text-center font-bold text-3xl md:text-4xl">Features</h2>

        <p className="pt-4 pb-8 text-center text-lg">
          <Balancer>
            Unprice is feature flag engine with superpowers. Report feature usage, track feature
            performance and optimize your pricing strategy easily. Some of the features include:
          </Balancer>
        </p>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {marketingFeatures.map((feature) => (
            <Card key={feature.title} className={cn("p-2")}>
              <CardHeader>{feature.icon}</CardHeader>
              <CardContent className="space-y-2">
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription className="mt-2">{feature.body}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="my-10 w-full max-w-screen-lg animate-fade-up gap-5 border-t p-5 xl:px-0">
        <h2 className="pt-4 text-center font-bold text-3xl md:text-4xl">Tech Stack</h2>

        <p className="pt-4 pb-8 text-center text-lg">
          <Balancer>
            Unprice is built with the latest technologies. We use Next.js, Tailwind CSS, and
            TypeScript to build a fast and modern web application. We also use Vercel for hosting
            and GitHub for version control. We are always looking for ways to improve our stack. If
            you have any suggestions, please let us know.
          </Balancer>
        </p>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {techStack.map((feature) => (
            <Card key={feature.title} className={cn("p-2")}>
              <CardHeader>{feature.icon}</CardHeader>
              <CardContent className="space-y-2">
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription className="mt-2">{feature.body}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
