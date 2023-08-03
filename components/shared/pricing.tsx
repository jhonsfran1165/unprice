import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import { HighlightGroup, HighlighterItem } from "./highlighter"
import { Particles } from "./particles"

const tiers = [
  {
    name: "Free",
    price: 0,
    description: "Free forever, for teams just getting started",
    features: ["10k Events per month", "1 Alert"],
    cta: "Get Started for Free",
  },
  {
    name: "Pro",
    price: 20,
    description: "For larger teams with increased usage",
    features: ["50k Events per month", "10 Alerts"],
    cta: "Try Pro for 14 days",
  },
  {
    name: "Enterprise",
    price: 50,
    description: "For businesses with custom needs",
    features: ["500k Events per month", "Unlimited Alerts"],
    cta: "Scale Up",
  },
]

export const Pricing: React.FC = () => {
  return (
    <section className="relative">
      {/* Radial gradient */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-0 flex aspect-square w-1/3 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <div className="translate-z-0 absolute inset-0 rounded-full bg-primary opacity-50 blur-[120px]" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Content */}
          <div className="mx-auto max-w-3xl pb-12 text-center md:pb-20">
            <div>
              <div className="inline-flex bg-gradient-to-r from-primary to-secondary bg-clip-text pb-3 font-medium text-transparent">
                Pricing plans
              </div>
            </div>
            <h2 className="from-zinc-200/60 via-zinc-200 to-zinc-200/60 bg-gradient-to-r bg-clip-text pb-4 text-4xl font-extrabold text-transparent">
              Simple and transparent
            </h2>
            <p className="text-zinc-400 text-lg">
              {"Invite your whole team, we don't do seat based pricing here."}
            </p>
          </div>
          {/* Pricing tabs */}
          <HighlightGroup className="group grid h-full gap-6 md:grid-cols-12">
            {/* Box #1 */}

            {tiers.map((tier, i) => (
              <div
                key={tier.name}
                className="group/item h-full  md:col-span-6 lg:col-span-4"
                data-aos="fade-down"
              >
                <HighlighterItem>
                  <div className="bg-zinc-900 relative z-20 h-full overflow-hidden rounded-[inherit]">
                    <Particles
                      className="absolute inset-0 -z-10 opacity-10 transition-opacity duration-1000 ease-in-out group-hover/item:opacity-100"
                      quantity={(i + 1) ** 2 * 10}
                      color={["#34d399", "#fde047", "#f43f5e"][i]}
                      vy={-0.2}
                    />
                    <div className="flex flex-col">
                      {/* Radial gradient */}
                      <div
                        className="pointer-events-none absolute bottom-0 left-1/2 -z-10 aspect-square w-1/2 -translate-x-1/2 translate-y-1/2"
                        aria-hidden="true"
                      >
                        <div className="translate-z-0 bg-zinc-800 absolute inset-0 rounded-full blur-[80px]" />
                      </div>
                      {/* Text */}

                      <div className="p-8">
                        <h3
                          id={tier.name}
                          className="text-lg font-semibold leading-8"
                        >
                          {tier.name}
                        </h3>

                        <h3 className="from-zinc-200/60 via-zinc-200 to-zinc-200/60 mt-6 inline-flex items-baseline bg-gradient-to-r bg-clip-text pb-1 font-bold text-transparent">
                          <span className="text-4xl">${tier.price}</span>
                          <span className="text-lg">/ month</span>
                        </h3>
                        <p className="text-zinc-400 mt-4 text-sm leading-6">
                          {tier.description}
                        </p>
                        <ul
                          role="list"
                          className="text-zinc-300 mt-8 space-y-3 text-sm leading-6"
                        >
                          {tier.features.map((feature) => (
                            <li key={feature} className="flex gap-x-3">
                              <Check
                                className={cn("h-6 w-5 flex-none", {
                                  "text-emerald-400": i === 0,
                                  "text-yellow-300": i === 1,
                                  "text-rose-500": i === 2,
                                })}
                                aria-hidden="true"
                              />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Link
                          className="text-zinc-900 group mt-16 flex w-full items-center justify-center whitespace-nowrap rounded bg-gradient-to-r from-white/80 via-white to-white/80  px-4 py-1.5 font-medium transition duration-150 ease-in-out hover:bg-white"
                          href="/overview"
                        >
                          Get Started{" "}
                          <ArrowRight className="tracking-normal text-primary-500 ml-1 h-3 w-3 transition-transform duration-150 ease-in-out group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </HighlighterItem>
              </div>
            ))}
            <div
              className="group/item h-full md:col-span-6  lg:col-span-12"
              data-aos="fade-down"
            >
              <HighlighterItem>
                <div className="bg-zinc-900 relative z-20 h-full overflow-hidden rounded-[inherit]">
                  <Particles
                    className="absolute inset-0 -z-10 opacity-10 transition-opacity duration-1000 ease-in-out group-hover/item:opacity-100"
                    quantity={200}
                  />
                  <div className="flex flex-col">
                    {/* Radial gradient */}
                    <div
                      className="pointer-events-none absolute bottom-0 left-1/2 -z-10 aspect-square w-1/2 -translate-x-1/2 translate-y-1/2"
                      aria-hidden="true"
                    >
                      <div className="translate-z-0 bg-zinc-800 absolute inset-0 rounded-full blur-[80px]" />
                    </div>
                    {/* Text */}

                    <div className="p-8">
                      <h3 className="text-lg font-semibold leading-8">
                        Self Hosted
                      </h3>

                      <p className="text-zinc-400 mt-4 text-sm leading-6">
                        Self host and maintain Highstorm on your own servers
                      </p>
                      <div className="mt-16">
                        <Button className="button-primary w-40">
                          <Link href="https://github.com/chronark/highstorm">
                            Deploy your own
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </HighlighterItem>
            </div>
          </HighlightGroup>
        </div>
      </div>
    </section>
  )
}
