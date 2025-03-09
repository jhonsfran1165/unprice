"use client"

import { Button } from "@unprice/ui/button"
import { Input } from "@unprice/ui/input"
import { motion } from "framer-motion"
import Balancer from "react-wrap-balancer"

export default function Cta() {
  return (
    <section aria-labelledby="cta-title" className="mx-auto mt-32 max-w-6xl p-1 px-2 sm:mt-56">
      <div className="relative flex items-center justify-center">
        <motion.div
          className="mask -z-10 pointer-events-none absolute select-none opacity-70"
          aria-hidden="true"
          animate={{ scale: [0.97, 1] }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex size-full flex-col gap-2">
            {Array.from({ length: 20 }, (_, idx) => (
              <div
                key={`outer-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  idx
                }`}
              >
                <div className="flex size-full gap-2">
                  {Array.from({ length: 41 }, (_, idx2) => (
                    <div
                      key={`inner-${idx}-${
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                        idx2
                      }`}
                    >
                      <div className="size-5 rounded-md shadow shadow-indigo-500/20 ring-1 ring-black/5 dark:shadow-indigo-500/20 dark:ring-white/5" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div
          className="max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h3
                id="cta-title"
                className="inline-block bg-clip-text p-2 font-bold text-4xl text-background-textContrast tracking-tighter md:text-6xl"
              >
                Ready to get started?
              </h3>
              <p className="mx-auto mt-4 max-w-2xl text-background-text text-lg">
                <Balancer>Create your app in minutes and get ready to launch.</Balancer>
              </p>
            </motion.div>
            <motion.div
              className="mt-14 w-full rounded-[16px] bg-background-bgSubtle p-1.5 ring-1 ring-background-line"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="rounded-xl bg-background-base p-4">
                <form
                  className="flex flex-col items-center gap-3 sm:flex-row"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <Input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    id="email"
                    className="h-10 w-full min-w-0 flex-auto"
                    placeholder="Your Email Address"
                  />
                  <Button
                    className="h-10 w-full sm:w-fit sm:flex-none"
                    type="submit"
                    variant="primary"
                  >
                    Get started
                  </Button>
                </form>
              </div>
            </motion.div>
            <motion.p
              className="mt-4 text-background-text text-xs sm:text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              Not sure where to start?{" "}
              <a
                href="mailto:sales@unprice.dev"
                className="font-semibold text-primary-textContrast hover:text-primary-textContrast/80"
              >
                Talk to me
              </a>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
