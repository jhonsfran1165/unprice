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
        Static price is dead.
        <br />
        <br />3 plans and once a year pricing review is not enough.
        <br />
        <br />
        Everything is moving toward customer-perceived value pricing, a fancy way to say; customers
        want to pay for the value your product creates. Yet you still price your product with
        one-size-fits-all pricing.
        <br />
        <br />
        This shift is a common phenomenon; think about the first smartphone.
        <br />
        <br />
        When smartphones first became popular, there were only a few models, and most people were
        satisfied with basic features like calling, texting, and a simple camera. As the market
        offered more specialized products, customers expectations increased. People started to
        demand more. Now, customers are much more demanding. A generic smartphone is rarely
        enough—buyers want a device that fits their specific needs perfectly.
        <br />
        <br />
        Same thing is happening in the SaaS market.
        <br />
        <br />
        In the past, SaaS companies could rely on a simple, static pricing page — think flat monthly
        fees or seat-based subscriptions. Customers would pay a fixed amount regardless of how much
        value they actually received. This approach worked well when SaaS markets were less
        competitive and customers had fewer alternatives.
        <br />
        <br />
        Today, however, customers expect pricing that reflects their actual usage or the outcomes
        they achieve. This shift is driven by a desire for fairer value exchange and flexibility as
        business needs change.
        <br />
        <br />
        Think about it, why are you moving off from certain SaaS?
        <br />
        <br />
        Why do you want other alternatives?
        <br />
        <br />
        Chances are, it comes down to a mismatch between value and price—or simply that the market
        has changed. Maybe you’re paying for features you never use, or you’ve found a solution that
        delivers more for less.
        <br />
        <br />
        Price is more than just a number. It’s a reflection of innovation — a direct mirror of the
        value your product delivers. And value isn’t static. It evolves with your customers’ needs,
        your product roadmap, and the market itself.
        <br />
        <br />
        So why are you still using static pricing?
        <br />
        <br />
        Consider this:
        <br />
        <br />
        <ul className="list-disc pl-10">
          <li>
            <span className="font-semibold">
              Hybrid pricing models (subscription + usage) drive results.
            </span>
            <br />
            Companies using these models see the highest median growth rate—21%—outperforming both
            pure subscription and pure usage-based models.
            <a
              href="https://www.maxio.com/resources/2025-saas-pricing-trends-report"
              target="_blank"
              className="ml-2 font-semibold text-blue-500 text-sm"
              rel="noopener noreferrer"
            >
              (Source: Maxio)
            </a>
            <br />
            <br />
          </li>
          <li>
            <span className="font-semibold">Pricing is moving closer to customer value.</span>
            <br />
            There’s a clear shift toward models that directly link what customers pay to the
            outcomes they achieve.
            <a
              href="https://metronome.com/blog/saas-pricing-predictions-for-2025-whats-coming-and-how-to-prepare"
              target="_blank"
              className="ml-2 font-semibold text-blue-500 text-sm"
              rel="noopener noreferrer"
            >
              (Source: Metronome)
            </a>
            <br />
            <br />
          </li>
          <li>
            <span className="font-semibold"> Pricing is no longer just a backend detail.</span>
            <br />
            It’s a strategic lever for growth — a fundamental part of your product experience.
            <br />
            <br />
          </li>
        </ul>
      </motion.div>
      <motion.div variants={itemVariants} className="mt-6 text-justify text-lg">
        Are you ready for the shift?
        <br />
        <br />
        Let’s be honest—most SaaS companies aren’t:
        <br />
        <br />
        <ul className="list-disc pl-10">
          <li>You’re unsure what your users are truly willing to pay.</li>
          <li>You lack the tools to adapt pricing as quickly as your product evolves.</li>
          <li>You treat pricing as a backend config, not a growth engine.</li>
          <li>You don’t know how to price for different customer segments.</li>
        </ul>
      </motion.div>
      <motion.div variants={itemVariants} className="mt-6 text-justify text-lg">
        The companies winning today are those who treat pricing as a product, not an afterthought.
        <br />
        <br />
        Are you ready to join them?
      </motion.div>
    </motion.section>
  )
}
