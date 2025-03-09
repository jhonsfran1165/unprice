'use client'

import { Button } from "@unprice/ui/button"
import { motion } from "framer-motion"
import { PlayCircle } from "lucide-react"
import Link from "next/link"
import HeroImage from "./hero-image"

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
        className="inline-block bg-gradient-to-br from-background-text to-background-textContrast bg-clip-text p-2 font-bold text-4xl text-transparent tracking-tighter sm:text-6xl md:text-7xl"
        variants={itemVariants}
      >
        Pricingengine for <br /> modern applications
      </motion.h1>
      <motion.p
        className="mt-6 max-w-lg text-background-text text-lg"
        variants={itemVariants}
      >
        Unprice is a general purpose, relational database built for modern
        application developers and for the cloud era.
      </motion.p>
      <motion.div
        className="mt-8 flex w-full flex-col justify-center gap-3 px-3 align-middle sm:flex-row"
        variants={itemVariants}
      >
        <Button className="h-10 font-semibold">
          <Link href="#">Start 14-day trial</Link>
        </Button>
        <Button
          asChild
          variant="link"
        >
          <Link
            href="https://www.youtube.com/watch?v=QRZ_l7cVzzU"
            className="text-background-textContrast"
            target="_blank"
          >
            <span className="mr-1 flex size-6 items-center justify-center rounded-full transition-all">
              <PlayCircle
                aria-hidden="true"
                className="size-5 shrink-0 text-background-textContrast"
              />
            </span>
            Watch video
          </Link>
        </Button>
      </motion.div>
      <motion.div
        className="relative mx-auto mt-20 ml-3 h-fit w-[40rem] max-w-6xl sm:ml-auto sm:w-full sm:px-2"
        variants={heroImageVariants}
      >
        <HeroImage />
        <div
          className="-bottom-20 -mx-10 absolute inset-x-0 h-2/4 bg-gradient-to-t from-background-base via-background-base to-transparent lg:h-1/4"
          aria-hidden="true"
        />
      </motion.div>
    </motion.section>
  )
}
