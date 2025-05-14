"use client"
import { APP_DOMAIN } from "@unprice/config"
import { buttonVariants } from "@unprice/ui/button"
import { motion, useInView } from "framer-motion"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRef } from "react"

export default function Belief() {
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
      aria-labelledby="vision-title"
      className="mx-auto mt-40 px-4"
    >
      <motion.h2
        variants={itemVariants}
        id="features-title"
        className="inline-block py-2 font-bold text-4xl text-background-textContrast tracking-tighter md:text-5xl"
      >
        Our Belief
      </motion.h2>
      <motion.div variants={itemVariants} className="mt-6 max-w-prose space-y-4">
        <p className="text-justify text-lg leading-8">
          SaaS, AI apps and consumers, deserve full control over how they capture and receive value.
          Static plans, vendor lock-in, and engineering bottlenecks are the enemy. Adaptive
          Monetization is the weapon. Open source is the armor.
          <br />
          <br />
          We're not here to tweak pricing.
          <br />
          <br />
          We're here to reinvent the monetization stack.
          <br />
          <br />
          You don't need Stripe's permission.
          <br />
          You don't need another pricing consultant.
          <br />
          You don't need guesswork and gut feelings.
          <br />
          <br />
          <span className="font-bold italic">
            We believe pricing is the most neglected growth lever in SaaS.
          </span>
          <br />
          <br />
          You need Adaptive Monetization — built on your terms, at your pace and at scale. If you're
          building the future, your pricing should be part of it.
          <br />
          <br />
          <span className="font-bold italic">Unprice, fair prices for everyone.</span>
        </p>
      </motion.div>
      <motion.div
        className="mx-auto mt-10 flex w-fit justify-center p-1.5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <Link href={`${APP_DOMAIN}`} className={buttonVariants({ variant: "primary" })}>
          Start for free
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </motion.div>
    </motion.section>
  )
}
