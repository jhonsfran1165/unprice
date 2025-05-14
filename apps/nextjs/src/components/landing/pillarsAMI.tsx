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
      <motion.p variants={itemVariants} className="mt-6 text-justify text-lg">
        Unprice is not a pricing tool. It’s the foundation of a new category: Adaptive Monetization
        Infrastructure. A framework designed to make pricing easy and scalable as your product
        grows. We believe pricing is the most neglected growth lever in SaaS.
        <br />
        <br />
        It’s time to change that — with systems, not guesswork.
        <br />
        <br />
        AMI is foundational infrastructure that gives you the right tools and processes to handle
        pricing like a billion dollar business since day one.
        <br />
        <br />
        AMI is the abstraction that allows to treat pricing as a growth lever, not just a backend
        config.
        <br />
        <br />
        Kill static pricing. Build a monetization system that learns as fast as your product.
      </motion.p>

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
