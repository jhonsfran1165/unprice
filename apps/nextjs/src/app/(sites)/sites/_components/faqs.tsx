"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@unprice/ui/accordion"
import { motion } from "framer-motion"

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

export function Faqs({ faqs }: { faqs: { question: string; answer: string }[] }) {
  return (
    <motion.section
      className="mx-auto max-w-3xl py-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h2 className="mb-8 text-center font-bold text-3xl">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index.toString()} value={`item-${index}`}>
            <AccordionTrigger className="font-semibold text-foreground text-lg">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-base">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.section>
  )
}
