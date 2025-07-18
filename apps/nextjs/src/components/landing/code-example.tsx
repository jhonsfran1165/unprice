"use client"
import { motion, useInView } from "framer-motion"
import { BarChart, Check, Code, Settings } from "lucide-react"
import { useRef } from "react"
import { SDKDemo } from "./sdk-examples"

const features = [
  {
    name: "Configure",
    description: "Create and manage your plans, features, and tiers from the Dashboard.",
    icon: Settings,
  },
  {
    name: "Use SDK",
    description: "Use our SDK in your project. Start incrementally.",
    icon: Code,
  },
  {
    name: "Verify and report",
    description: "Verify and report on your feature usage, billing, signals and more.",
    icon: Check,
  },
  {
    name: "Data and Insights",
    description: "Get insights into your users and their behavior from data.",
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
      className="mx-auto w-full max-w-4xl px-4 py-20"
    >
      <motion.h2
        variants={itemVariants}
        id="features-title"
        className="mt-2 inline-block bg-clip-text py-2 font-bold text-4xl text-background-textContrast tracking-tighter sm:text-6xl md:text-6xl"
      >
        Built by developers, <br /> for developers
      </motion.h2>
      <motion.div variants={itemVariants} className="mt-6 text-justify text-lg">
        The biggest constraint to iterate on pricing is the engineering effort and the risk of
        losing customers. Unprice solves those two issues and gives you the developer experience to
        implement once and forget about it. Pricing logic belongs to business teams, not backlogs.
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
            <div className="flex items-center gap-2 align-middle text-primary-text">
              <item.icon aria-hidden="true" className="size-6" />
              <dt className="font-semibold">{item.name}</dt>
            </div>
            <dd className="mt-2 text-background-text leading-7">{item.description}</dd>
          </motion.div>
        ))}
      </motion.dl>
    </motion.section>
  )
}
