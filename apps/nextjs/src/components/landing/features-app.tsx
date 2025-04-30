"use client"

import { motion } from "framer-motion"

const stats = [
  {
    name: "Ease of use",
    value: "100%",
  },
  {
    name: "Latency",
    value: "<100ms",
  },
  {
    name: "Reliability",
    value: "99.99%",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
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

const statsContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
}

export function FeaturesApp() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
      aria-labelledby="features-title"
      className="mx-auto mt-44 w-full max-w-6xl px-3"
    >
      <motion.h2
        variants={itemVariants}
        id="features-title"
        className="mt-2 inline-block bg-clip-text py-2 font-bold text-4xl text-background-textContrast tracking-tighter sm:text-6xl md:text-6xl"
      >
        Architected for speed and reliability
      </motion.h2>

      <motion.p
        variants={itemVariants}
        className="mt-6 max-w-3xl text-background-text text-lg leading-7"
      >
        Unprice&rsquo; powered the cloud providers to be the fastest and most reliable in the world.
        You can measure your own performance and optimize your systems.
      </motion.p>

      <motion.dl
        variants={statsContainerVariants}
        className="mt-12 grid grid-cols-1 gap-y-8 md:grid-cols-3 md:border-y md:py-14"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={index.toString()}
            variants={itemVariants}
            className="border-l-2 pl-6 md:border-l md:text-center lg:border-background-border lg:first:border-none"
          >
            <motion.dd className="inline-block bg-clip-text font-bold text-5xl text-primary-text tracking-tight lg:text-6xl">
              {stat.value}
            </motion.dd>
            <motion.dt className="mt-1">{stat.name}</motion.dt>
          </motion.div>
        ))}
      </motion.dl>
    </motion.section>
  )
}
