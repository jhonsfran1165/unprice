import { CalendarIcon, FileTextIcon } from "lucide-react"
import { BellIcon, Share2Icon } from "lucide-react"

import { Calendar } from "@unprice/ui/calendar"
import { cn } from "@unprice/ui/utils"
import { AnimatedBeamDemo } from "./animated-beam-demo"
import { AnimatedListDemo } from "./animated-list-demo"
import { BentoCard, BentoGrid } from "./bento-grid"
import { Marquee } from "./marquee"

const files = [
  {
    name: "FREE",
    body: "Unprice is free to use. You can get started with Unprice in minutes.",
  },
  {
    name: "PRO",
    body: "Unprice Pro is a paid plan that gives you access to more features and support.",
  },
  {
    name: "ENTERPRISE",
    body: "Unprice Enterprise is a custom plan that is tailored to your business needs.",
  },
]

const features = [
  {
    Icon: FileTextIcon,
    name: "Manage plans & pricing",
    description: "Version plans, migrate customers, implement any pricing model you want.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-1",
    background: (
      <Marquee
        pauseOnHover
        className="absolute top-10 [--duration:20s] [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] "
      >
        {files.map((f, idx) => (
          <figure
            key={idx.toString()}
            className={cn(
              "relative w-32 cursor-pointer overflow-hidden rounded-xl border p-4",
              "border-background-border bg-background-base hover:bg-background-base/50",
              "transform-gpu blur-[1px] transition-all duration-300 ease-out hover:blur-none"
            )}
          >
            <div className="flex flex-row items-center gap-2">
              <div className="flex flex-col">
                <figcaption className="font-medium text-sm">{f.name}</figcaption>
              </div>
            </div>
            <blockquote className="mt-2 text-xs">{f.body}</blockquote>
          </figure>
        ))}
      </Marquee>
    ),
  },
  {
    Icon: BellIcon,
    name: "Metering & usage-based pricing",
    description: "Report usage and get real-time insights to optimize your pricing.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2",
    background: (
      <AnimatedListDemo className="absolute top-4 right-2 h-[300px] w-full scale-75 border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-90" />
    ),
  },
  {
    Icon: Share2Icon,
    name: "Automated billing",
    description:
      "Use plug and play integrations to automate your billing with different payment providers.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2",
    background: (
      <AnimatedBeamDemo className="absolute top-4 right-2 h-[300px] border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-105" />
    ),
  },
  {
    Icon: CalendarIcon,
    name: "Subscription & Customer",
    description: "Manage subscriptions, cancel, pause, resume, and more.",
    className: "col-span-3 lg:col-span-1",
    href: "#",
    cta: "Learn more",
    background: (
      <Calendar
        mode="single"
        selected={new Date(2022, 4, 11, 0, 0, 0)}
        className="absolute top-10 right-0 origin-top scale-75 rounded-md border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-90"
      />
    ),
  },
]

export const Features = () => {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:max-w-4xl">
      <BentoGrid>
        {features.map((feature, idx) => (
          <BentoCard key={idx.toString()} {...feature} />
        ))}
      </BentoGrid>
    </div>
  )
}
