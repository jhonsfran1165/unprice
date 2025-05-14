"use client"

import type React from "react"

import { Button } from "@unprice/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@unprice/ui/tooltip"
import { motion, useInView } from "framer-motion"
import { BarChart, Code, DollarSign, TrendingUp } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type SectionKey = "growth" | "data" | "billing" | "opensource"

interface SectionData {
  title: string
  icon: React.ReactNode
  description: string
  color: string
  position: {
    angle: number
  }
}

// Define sections with precise geometric positions
const sections: Record<SectionKey, SectionData> = {
  growth: {
    title: "Growth Autonomy",
    icon: <TrendingUp className="h-full w-full p-3" />,
    description:
      "Your engineering team should be decoupled from your marketing and growth team. Imagine running pricing experiments at the ease of a click, no engineering effort.",
    color: "bg-background-background",
    position: {
      angle: 270, // Top (270 degrees from right horizontal)
    },
  },
  billing: {
    title: "Sovereign Billing",
    icon: <DollarSign className="h-full w-full p-3" />,
    description:
      "Billing providers should be decoupled from your app. Imagine being able to run multiple plans for multiple providers. Adaptive monetization requires the flexibility to change payment provider without too much effort.",
    color: "bg-background-background",
    position: {
      angle: 30, // Bottom left (30 degrees from right horizontal)
    },
  },
  data: {
    title: "Adaptive Stack",
    icon: <BarChart className="h-full w-full p-3" />,
    description:
      "Data driven is no longer enough. You need an adaptive tech stack allows you to adapt your pricing and plans to your customers.",
    color: "bg-background-background",
    position: {
      angle: 150, // Bottom right (150 degrees from right horizontal)
    },
  },
  opensource: {
    title: "Open Source",
    icon: <Code className="h-full w-full p-3" />,
    description: "Of course all this is powered by open source software. You should own the code.",
    color: "bg-background-background",
    position: {
      angle: 0, // Center (not used for positioning)
    },
  },
}

export function UnpriceManifesto() {
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null)
  const [hoveredSection, setHoveredSection] = useState<SectionKey | null>(null)
  const [animationPhase, setAnimationPhase] = useState(0)
  const [showGoldenRatio, setShowGoldenRatio] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.3 })

  // Control animation phases
  useEffect(() => {
    if (isInView) {
      const timer1 = setTimeout(() => setAnimationPhase(1), 1000)
      const timer2 = setTimeout(() => setAnimationPhase(2), 2000)
      const timer3 = setTimeout(() => setAnimationPhase(3), 3000)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }
  }, [isInView])

  // Geometry constants
  const circleRadius = 50
  const circleBorder = 8 // matches Tailwind border-[8px]
  const triangleStroke = 8 // visually matches the circle
  const triangleRadius = circleRadius - circleBorder / 2 - triangleStroke / 2

  // Angles for equilateral triangle (top, bottom left, bottom right)
  const triangleAngles = [270, 30, 150]

  function getPosition(angle: number, radius: number) {
    const angleInRadians = (angle * Math.PI) / 180
    const x = 50 + Math.cos(angleInRadians) * radius
    const y = 50 + Math.sin(angleInRadians) * radius
    return { x, y }
  }

  // Calculate centroid of the triangle for perfect center alignment
  function getTriangleCentroid() {
    const points = triangleAngles.map((angle) => getPosition(angle, triangleRadius))
    const centroidX = (points[0]!.x + points[1]!.x + points[2]!.x) / 3
    const centroidY = (points[0]!.y + points[1]!.y + points[2]!.y) / 3
    return { x: centroidX, y: centroidY }
  }

  const triangleCentroid = getTriangleCentroid()

  // Center point
  const centerPoint = { x: 50, y: 50 }

  const trianglePath = (() => {
    const points = triangleAngles.map((angle) => getPosition(angle, triangleRadius))
    return `M ${points[0]!.x},${points[0]!.y} L ${points[1]!.x},${points[1]!.y} L ${points[2]!.x},${points[2]!.y} Z`
  })()

  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 500) {
        setShowGoldenRatio(true)
      } else {
        setShowGoldenRatio(false)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <TooltipProvider>
      <div ref={containerRef} className="relative mx-auto w-full max-w-3xl px-4 py-40">
        <div className="relative mx-auto aspect-square w-full max-w-2xl">
          {/* Main circle */}
          <motion.div
            className="absolute inset-0 rounded-full border-[5px] border-background-border"
            initial={{ scale: 0 }}
            animate={{ scale: isInView ? 1 : 0 }}
            transition={{
              duration: 1,
              delay: 0.3,
              type: "spring",
              stiffness: 100,
            }}
          />

          {/* Vitruvian Man-inspired guidelines (only visible when toggled) */}
          {showGoldenRatio && (
            <motion.svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ duration: 0.3 }}
            >
              {/* Golden ratio spiral */}
              <path
                d="M 50 50 Q 65 35, 80 50 T 50 80 T 20 50 T 50 20"
                fill="none"
                className="stroke-background-line dark:stroke-background-borderHover"
                strokeWidth="0.5"
                strokeDasharray="1,2"
              />

              {/* Golden ratio rectangles */}
              <rect
                x="30.9"
                y="30.9"
                width="38.2"
                height="38.2"
                className="stroke-background-border dark:stroke-background-bgHover"
                strokeWidth="0.3"
                fill="none"
              />
              <rect
                x="38.2"
                y="38.2"
                width="23.6"
                height="23.6"
                className="stroke-background-border dark:stroke-background-bgHover"
                strokeWidth="0.3"
                fill="none"
              />

              {/* Horizontal and vertical guidelines */}
              <line
                x1="0"
                y1="50"
                x2="100"
                y2="50"
                className="stroke-background-border dark:stroke-background-borderHover"
                strokeWidth="0.3"
                strokeDasharray="1,2"
              />
              <line
                x1="50"
                y1="0"
                x2="50"
                y2="100"
                className="stroke-background-border dark:stroke-background-borderHover"
                strokeWidth="0.3"
                strokeDasharray="1,2"
              />

              {/* Golden ratio circles */}
              <circle
                cx="50"
                cy="50"
                r="30.9"
                className="stroke-background-border dark:stroke-background-bgHover"
                strokeWidth="0.3"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="19.1"
                className="stroke-background-border dark:stroke-background-bgHover"
                strokeWidth="0.3"
                fill="none"
              />
            </motion.svg>
          )}

          {/* Center text */}
          <motion.div
            className="absolute z-10 text-center"
            style={{
              left: `${triangleCentroid.x}%`,
              top: `${triangleCentroid.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: animationPhase >= 1 ? 1 : 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: animationPhase >= 1 ? 1 : 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="-mb-5 font-bold text-2xl text-background-textContrast md:text-3xl"
            >
              UNPRICE
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: animationPhase >= 1 ? 1 : 0, y: 15 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-background-text text-sm"
            >
              fair prices for everyone
            </motion.div>
          </motion.div>

          {/* Triangle with perfect geometric alignment */}
          {animationPhase >= 2 && (
            <motion.svg
              className="absolute inset-0 h-ful w-full"
              viewBox="0 0 100 100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              {/* Triangle path */}
              <motion.path
                d={trianglePath}
                className="stroke-background-line"
                strokeWidth="0.7"
                fill="none"
                strokeLinejoin="round"
              />

              {/* Connecting lines from center to vertices (subtle) */}
              {Object.entries(sections).map(([key, section], index) => {
                // Skip the center section
                if (key === "opensource") return null

                const iconCenter = getPosition(section.position.angle, circleRadius)
                const iconX = iconCenter.x
                const iconY = iconCenter.y

                return (
                  <motion.line
                    key={key}
                    x1={centerPoint.x}
                    y1={centerPoint.y}
                    x2={iconX}
                    y2={iconY}
                    className="stroke-background-line"
                    strokeWidth="0.2"
                    strokeDasharray="1,1"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: showGoldenRatio ? 1 : 0 }}
                    transition={{ duration: 0.8, delay: 0.2 * index }}
                  />
                )
              })}
            </motion.svg>
          )}

          {/* Section icons */}
          {Object.entries(sections).map(([key, section], index) => {
            const sectionKey = key as SectionKey
            const isActive = activeSection === sectionKey
            const isHovered = hoveredSection === sectionKey

            // Skip the center "opensource" section for the vertices
            if (sectionKey === "opensource") {
              return null
            }

            // Icon/label position: center exactly on the circle's edge, icon outside
            const iconCenter = getPosition(section.position.angle, circleRadius)
            const iconX = iconCenter.x
            const iconY = iconCenter.y

            return (
              <div key={key} className="absolute h-full w-full">
                {/* Icon with circle background and tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      style={{
                        position: "absolute",
                        left: `${iconX}%`,
                        top: `${iconY}%`,
                        width: "3rem",
                        height: "3rem",
                        transform: "translate(-50%, -50%)",
                        zIndex: 10,
                        opacity: animationPhase >= 3 ? 1 : 0,
                        scale: animationPhase >= 3 ? 1 : 0.7,
                      }}
                      className={
                        "flex size-6 items-center justify-center rounded-full border p-0 shadow-sm transition-all"
                      }
                      onClick={() =>
                        setActiveSection(sectionKey === activeSection ? null : sectionKey)
                      }
                      onMouseEnter={() => setHoveredSection(sectionKey)}
                      onMouseLeave={() => setHoveredSection(null)}
                      variant="primary"
                    >
                      {section.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" className="w-64 bg-background-bg p-4">
                    <div className="flex items-start gap-3">
                      <div>
                        <h4 className="font-bold text-background-textContrast">{section.title}</h4>
                        <p className="mt-1 text-background-text text-sm">{section.description}</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
                {/* Section title */}
                <motion.div
                  className="-translate-x-1/2 pointer-events-auto absolute hidden w-20 max-w-[150px] transform cursor-pointer text-left md:block"
                  style={{
                    left:
                      section.position.angle === 270
                        ? `${iconX + 5}%`
                        : section.position.angle === 30
                          ? `${iconX + 5}%`
                          : `${iconX - 18}%`,
                    top:
                      section.position.angle === 270
                        ? `${iconY - 10}%`
                        : section.position.angle === 30
                          ? `${iconY}%`
                          : `${iconY}%`,
                  }}
                  initial={{ opacity: 0, y: section.position.angle === 270 ? 10 : -10 }}
                  animate={{
                    opacity: animationPhase >= 3 ? 1 : 0,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: 0.2 + 0.2 * index,
                  }}
                  onClick={() => setActiveSection(sectionKey === activeSection ? null : sectionKey)}
                  onMouseEnter={() => setHoveredSection(sectionKey)}
                  onMouseLeave={() => setHoveredSection(null)}
                >
                  <h3
                    className={`font-bold text-base md:text-lg ${isActive || isHovered ? "text-background-textContrast" : "text-background-text"}`}
                  >
                    {section.title}
                  </h3>
                </motion.div>
              </div>
            )
          })}

          {/* Center "Open Source" section */}
          <motion.div
            className="pointer-events-auto flex cursor-pointer items-center gap-1"
            style={{
              position: "absolute",
              left: `${centerPoint.x - 10}%`,
              top: `${centerPoint.y + 30}%`,
              width: 170,
              height: 50,
              transform: "translate(-50%, -50%)",
              zIndex: 10,
              opacity: animationPhase >= 3 ? 1 : 0,
              scale: animationPhase >= 3 ? 1 : 0.7,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: animationPhase >= 3 ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`flex w-full items-center gap-1 ${
                    activeSection === "opensource" || hoveredSection === "opensource"
                      ? "text-background-textContrast"
                      : "text-background-text"
                  }`}
                  onClick={() =>
                    setActiveSection("opensource" === activeSection ? null : "opensource")
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveSection("opensource" === activeSection ? null : "opensource")
                    }
                  }}
                  onMouseEnter={() => setHoveredSection("opensource")}
                  onMouseLeave={() => setHoveredSection(null)}
                >
                  <Code className="h-5 w-5" />
                  <span className="font-medium text-sm md:text-lg">
                    {sections.opensource.title}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="w-64 bg-background-bg p-4">
                <div className="flex items-start gap-3">
                  <div>
                    <h4 className="font-bold text-background-textContrast">
                      {sections.opensource.title}
                    </h4>
                    <p className="mt-1 text-background-text text-sm">
                      {sections.opensource.description}
                    </p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        </div>

        {/* Instructions */}
        <motion.div
          className="mt-6 text-center text-background-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: animationPhase >= 3 ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <p className="text-sm">Adaptive monetization infrastructure principles</p>
        </motion.div>
      </div>
    </TooltipProvider>
  )
}
