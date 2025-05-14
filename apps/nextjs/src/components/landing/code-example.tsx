"use client"
import { API_DOMAIN } from "@unprice/config"
import { Button } from "@unprice/ui/button"
import { motion, useInView } from "framer-motion"
import { BarChart, Check, Code, Settings } from "lucide-react"
import Link from "next/link"
import { useRef } from "react"
import { SDKDemo } from "./sdk-examples"

const features = [
  {
    name: "Use typescript SDK",
    description:
      "Install the Unprice SDK in your project and start using it in minutes. Start incrementally, then go all in.",
    icon: Code,
  },
  {
    name: "Configure your plans",
    description: "Create and manage your plans, features, and tiers in the Unprice Dashboard.",
    icon: Settings,
  },
  {
    name: "Verify and report",
    description: "Verify and report on your feature usage, billing, signals and more.",
    icon: Check,
  },
  {
    name: "Data and Insights",
    description:
      "Measure usage, billing, willingness to pay, etc. Get insights into your users and their behavior.",
    icon: BarChart,
  },
]

export default function CodeExample() {
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
        duration: 0.5,
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
      aria-labelledby="code-example-title"
      className="mx-auto w-full max-w-4xl px-4 py-10"
    >
      <motion.h2
        variants={itemVariants}
        id="features-title"
        className="mt-2 inline-block bg-clip-text py-2 font-bold text-4xl text-background-textContrast tracking-tighter sm:text-6xl md:text-6xl"
      >
        Built by developers, <br /> for developers
      </motion.h2>
      <motion.div variants={itemVariants} className="mt-6 text-justify text-lg">
        The biggest constraint to iterate on pricing is the engineering effort. Unprice give you the
        developer experience to implement once and forget about it. Pricing logic belongs to
        business teams, not backlogs.
        <div className="mt-10 flex justify-end">
          <Link href={`${API_DOMAIN}reference`} target="_blank">
            <Button variant="outline">Check API docs</Button>
          </Link>
        </div>
      </motion.div>
      <motion.div variants={itemVariants}>
        <SDKDemo />
      </motion.div>
      <motion.dl variants={containerVariants} className="mt-24 grid grid-cols-4 gap-10">
        {features.map((item) => (
          <motion.div
            key={item.name}
            variants={itemVariants}
            className="col-span-full sm:col-span-2 lg:col-span-1"
          >
            <div className="w-fit rounded-lg p-2 shadow-md shadow-primary-line ring-1 ring-black/5 dark:shadow-primary-line/30 dark:ring-white/5">
              <item.icon aria-hidden="true" className="size-6 text-primary-text" />
            </div>
            <dt className="mt-6 font-semibold text-background-textContrast">{item.name}</dt>
            <dd className="mt-2 text-background-text text-lg leading-7">{item.description}</dd>
          </motion.div>
        ))}
      </motion.dl>
    </motion.section>
  )
}
