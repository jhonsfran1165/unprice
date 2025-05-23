"use client"

import { motion, useInView } from "framer-motion"
import { BarChart, Code, DollarSign, TrendingUp } from "lucide-react"
import { useRef } from "react"
import { AnimatedBeamDemo } from "./animated-beam-demo"

const PillarsOfAMI = [
  {
    title: "Adaptive Stack",
    icon: <BarChart className="h-5 w-5" />,
    description:
      "Implement any pricing model — usage-based, seat-based, feature-based, hybrid — in real-time. React to market shifts, customer signals, or product changes with data, no guesswork.",
    practice: "Pricing is a product surface. Treat it like one.",
  },
  {
    title: "Growth Autonomy",
    icon: <TrendingUp className="h-5 w-5" />,
    description:
      "Pricing should be owned by growth teams — not trapped in backlogs. You should be able to run experiments at the ease of a click, no engineering effort.",
    practice: "Pricing logic belongs to business teams. Not JIRA tickets.",
  },
  {
    title: "Billing Autonomy",
    icon: <DollarSign className="h-5 w-5" />,
    description:
      "Never be held hostage by your payment provider again. Swap Stripe for Paddle, crypto, or your own gateway.",
    practice: "Payments are infrastructure, not dependencies.",
  },
  {
    title: "Open Source",
    icon: <Code className="h-5 w-5" />,
    description:
      "Open isn’t just a license. It’s a belief system. The future of monetization must be open.",
    practice: "We believe the future of monetization must be open, auditable, and programmable",
  },
]

export default function PillarsAMI() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 2,
        ease: "easeOut",
      },
    },
  }

  return (
    <motion.section
      ref={sectionRef}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      aria-labelledby="benefits-title"
      className="mx-auto mt-28 px-4"
    >
      <motion.h2
        variants={itemVariants}
        id="benefits-title"
        className="inline-block py-2 font-bold text-4xl text-background-textContrast tracking-tighter md:text-5xl"
      >
        The Solution: AMI
      </motion.h2>
      <motion.div variants={itemVariants} className="mt-6 text-justify text-lg">
        Unprice is not a pricing tool. It’s the foundation of a new category:{" "}
        <b>Adaptive Monetization Infrastructure</b> — a framework built to make pricing effortless
        and scalable as your product evolves. We believe pricing is the most overlooked growth lever
        in SaaS. It’s time to change that — with systems, not guesswork.
        <br />
        <br />
        <b>What is AMI?</b>
        <br />
        AMI is foundational infrastructure designed to give you the tools and processes to handle
        pricing like a billion-dollar business, right from day one. It’s the abstraction layer that
        transforms pricing from a backend configuration into a core growth engine.
        <br />
        <br />
        <b>Why AMI Matters?</b>
        <br />
        <ul className="my-4 list-disc pl-10">
          <li>
            <span className="font-semibold">Dynamic, Not Static:</span> Kill static pricing. AMI
            enables you to build a monetization system that learns and adapts as quickly as your
            product and your market.
          </li>
          <li>
            <span className="font-semibold">Continuous Learning:</span> AMI doesn't just set prices
            — it continuously collects data, tests, and optimizes. Your pricing evolves in real
            time, keeping you ahead of the competition.
          </li>
          <li>
            <span className="font-semibold">Segment-Aware:</span> Easily tailor pricing for
            different customer segments, geographies, or use cases—without engineering bottlenecks
            or risky manual changes.
          </li>
          <li>
            <span className="font-semibold">Seamless Integration:</span> AMI fits into your existing
            stack, letting you experiment, iterate, and deploy new pricing models without disrupting
            your product or your customers.
          </li>
        </ul>
        <br />
        <b>The AMI Advantage</b>
        <br />
        <ul className="my-4 list-disc pl-10">
          <li>
            <span className="font-semibold">Move Fast, Stay Flexible:</span> Launch new pricing
            experiments in hours, not months.
          </li>
          <li>
            <span className="font-semibold">Unlock Growth:</span> Capture more value from every
            customer, every segment, every feature.
          </li>
          <li>
            <span className="font-semibold">Future-Proof Your Monetization:</span> As your product
            and market change, your pricing keeps pace.
          </li>
        </ul>
        <br />
        Stop treating pricing as an afterthought
        <br />
        <br />
        <b>The future of pricing is here.</b>
      </motion.div>

      <motion.div variants={itemVariants} className="my-28 flex justify-center">
        <AnimatedBeamDemo />
      </motion.div>

      <motion.dl
        variants={itemVariants}
        className="mt-8 grid grid-cols-4 gap-x-10 gap-y-8 sm:mt-12 sm:gap-y-10"
      >
        {PillarsOfAMI.map((pillar) => (
          <div key={pillar.title} className="col-span-4 sm:col-span-2 lg:col-span-1">
            <dt className="flex items-center gap-2 font-semibold text-primary-text">
              {pillar.icon}
              {pillar.title}
            </dt>
            <dd className="mt-2 leading-7">{pillar.description}</dd>
            <dd className="mt-2 font-semibold text-muted-foreground text-sm italic leading-7">
              &quot;{pillar.practice}&quot;
            </dd>
          </div>
        ))}
      </motion.dl>
    </motion.section>
  )
}
