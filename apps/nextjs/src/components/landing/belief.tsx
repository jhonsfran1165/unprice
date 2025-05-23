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
          We believe SaaS founders, AI app builders, and their customers deserve full control over
          how value is captured and delivered.
          <br />
          <br />
          Static plans, vendor lock-in, and engineering bottlenecks? Those are relics of the past.
          Adaptive Monetization is your weapon. Open source is your armor.
          <br />
          <br />
          We’re not here to tweak pricing around the edges.
          <br />
          We’re here to reinvent the entire monetization stack — from the ground up.
          <br />
          <br />
          You don’t need Stripe’s permission to innovate.
          <br />
          You don’t need another pricing consultant to tell you what you already know.
          <br />
          You don’t need to rely on guesswork or gut feelings.
          <br />
          <br />
          You need Adaptive Monetization — built on your terms, at your pace and at any scale.
          <br />
          <br />
          <span className="font-bold italic">
            We believe pricing is the most neglected growth lever in SaaS. It’s time to change that.
          </span>
          <br />
          <br />
          <span className="font-bold italic">Unprice, better pricing for SaaS.</span>
        </p>
      </motion.div>
      <motion.div
        className="mx-auto mt-20 flex w-fit justify-center p-1.5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <Link href={`${APP_DOMAIN}`} className={buttonVariants({ variant: "primary" })}>
          Start pricing
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </motion.div>
    </motion.section>
  )
}
