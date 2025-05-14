"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

export default function MainfestoCopy() {
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
        The Market Shift
      </motion.h2>
      <motion.div variants={itemVariants} className="mt-6 text-justify text-lg">
        Static pricing is dead. Everything is moving toward customer-perceived value, yet you still
        price your product with one-size-fits-all pricing.
        <br />
        <br />
        You don't need to be a genius to see that this is a problem, and it is accelerating thanks
        to AI.
        <br />
        <br />
        This shift is a common phenomenon; the market specializes, the customer specializes too,
        becoming more demanding and hard to please.
        <br />
        <br />
        In the old days, you could get away with a static pricing page, and think about pricing
        strategy once your product is mature, but not anymore, today, customers expect pricing based
        on their usage and outcomes.
        <br />
        <br />
        Think about it, why are you moving off from certain SaaS?
        <br />
        <br />
        Why do you want other alternatives?
        <br />
        <br />
        It's probably because a mix of value-price mismatch and changes in the market.
        <br />
        <br />
        Price is innovation. Price is a mirror that reflects value.
        <br />
        <br />
        And value is always changing. It's not static.
        <br />
        <br />
        So why are you still using static pricing?
        <br />
        <br />
        Some undeniable truths:
        <br />
        <br />
        <ul className="list-disc pl-10">
          <li>
            Companies using hybrid models (subscription + usage) report the highest median growth
            rate (21%), outperforming pure subscription and usage-based models.
            <a
              href="https://www.maxio.com/resources/2025-saas-pricing-trends-report"
              target="_blank"
              className="ml-2 font-semibold text-blue-500 text-sm"
              rel="noopener noreferrer"
            >
              (Source: Maxio)
            </a>
          </li>
          <li>
            There is a clear movement toward pricing models that directly tie cost to customer
            outcomes or value received.
            <a
              href="https://metronome.com/blog/saas-pricing-predictions-for-2025-whats-coming-and-how-to-prepare"
              target="_blank"
              className="ml-2 font-semibold text-blue-500 text-sm"
              rel="noopener noreferrer"
            >
              (Source: Metronome)
            </a>
          </li>
          <li>Pricing is now a strategic growth lever, not just an operational detail.</li>
        </ul>
      </motion.div>
      <motion.div variants={itemVariants} className="mt-6 text-justify text-lg">
        But let's be honest, you are not ready for this shift:
        <br />
        <br />
        <ul className="list-disc pl-10">
          <li>You don’t know what your users are truly willing to pay.</li>
          <li>You lack the tools to adapt pricing at the speed of your product.</li>
          <li>You treat pricing like a backend config, not a growth engine.</li>
          <li>You are not sure how to price your product for different segments of your market.</li>
        </ul>
      </motion.div>
      <motion.div variants={itemVariants} className="mt-6 text-justify text-lg">
        And if you can’t evolve your monetization in real-time, you will lose to someone who can.
      </motion.div>
    </motion.section>
  )
}
