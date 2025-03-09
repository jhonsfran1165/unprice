"use client"

import { APP_DOMAIN } from "@unprice/config"
import { Button } from "@unprice/ui/button"
import { GitHub } from "@unprice/ui/icons"
import { motion } from "framer-motion"
import Link from "next/link"
import Balancer from "react-wrap-balancer"
import { HeroVideoDialog } from "./hero-video"
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
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
}

const heroImageVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      delay: 0.6,
    },
  },
}

export default function Hero() {
  return (
    <motion.section
      aria-labelledby="hero-title"
      className="mt-32 flex flex-col items-center justify-center text-center sm:mt-40"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1
        id="hero-title"
        className="inline-block bg-clip-text p-2 font-bold text-4xl text-background-textContrast tracking-tighter sm:text-6xl md:text-7xl"
        variants={itemVariants}
      >
        <Balancer>Unprice pricing platform for modern saas.</Balancer>
      </motion.h1>
      <motion.p className="mt-6 max-w-xl text-background-text text-lg" variants={itemVariants}>
        Product market fit is a lie, in the world of saas everything starts with price.
        Product-market-price fit is the new normal. Unprice helps you manage, iterate and find the
        right price for your saas.
      </motion.p>
      <motion.div
        className="mt-8 flex w-full flex-col justify-center gap-3 px-3 align-middle sm:flex-row"
        variants={itemVariants}
      >
        <Button className="h-10 font-semibold">
          <Link href={`${APP_DOMAIN}`}>Start for free</Link>
        </Button>
        <Button asChild variant="link">
          <Link
            href="https://github.com/jhonsfran1165/unprice"
            className="text-background-textContrast"
            target="_blank"
          >
            <span className="mr-1 flex size-6 items-center justify-center rounded-full transition-all">
              <GitHub aria-hidden="true" className="size-5 shrink-0 text-background-textContrast" />
            </span>
            <span>Star on GitHub</span>
          </Link>
        </Button>
      </motion.div>
      <motion.div
        className="relative mx-auto mt-20 ml-3 h-fit w-[40rem] max-w-6xl sm:ml-auto sm:w-full sm:px-2"
        variants={heroImageVariants}
      >
        <div className="relative">
          <HeroVideoDialog
            className="block dark:hidden"
            animationStyle="from-center"
            videoSrc="https://www.youtube.com/embed/vAirXo6FJDs"
            thumbnailSrc="/unprice-light.png"
            thumbnailAlt="Hero Video"
          />
          <HeroVideoDialog
            className="hidden dark:block"
            animationStyle="from-center"
            videoSrc="https://www.youtube.com/embed/vAirXo6FJDs"
            thumbnailSrc="/unprice-dark.png"
            thumbnailAlt="Hero Video"
          />
        </div>

        <div
          className="-bottom-20 -mx-10 absolute inset-x-0 h-2/4 bg-gradient-to-t from-background-base via-background-base to-transparent lg:h-1/4"
          aria-hidden="true"
        />
      </motion.div>

      <motion.p
        className="mt-28 max-w-2xl py-16 text-background-text text-lg"
        variants={itemVariants}
      >
        Unprice is a feature flag engine with superpowers. Track feature usage, bill customer,
        support subscription, validate access to features, analyze feature performance and optimize
        your pricing strategy easily.
      </motion.p>
    </motion.section>
  )
}
