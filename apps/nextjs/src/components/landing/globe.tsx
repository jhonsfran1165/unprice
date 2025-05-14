"use client"

import createGlobe, { type COBEOptions } from "cobe"
import { motion, useAnimation, useMotionValue, useSpring } from "framer-motion"
import { useEffect, useRef } from "react"

import { cn } from "@unprice/ui/utils"
import { useTheme } from "next-themes"
import useIntersectionObserver from "../../hooks/use-intersection-observer"

const MOVEMENT_DAMPING = 1400

const GLOBE_CONFIG: COBEOptions = {
  width: 900,
  height: 900,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 0.4,
  mapSamples: 25000,
  mapBrightness: 5,
  baseColor: [1, 1, 1],
  markerColor: [255 / 255, 197 / 255, 61 / 255],
  glowColor: [0.5, 0.5, 0.5],
  markers: [
    { location: [14.5995, 120.9842], size: 0.03 },
    { location: [19.076, 72.8777], size: 0.1 },
    { location: [23.8103, 90.4125], size: 0.05 },
    { location: [30.0444, 31.2357], size: 0.07 },
    { location: [39.9042, 116.4074], size: 0.08 },
    { location: [-23.5505, -46.6333], size: 0.1 },
    { location: [19.4326, -99.1332], size: 0.1 },
    { location: [40.7128, -74.006], size: 0.1 },
    { location: [34.6937, 135.5022], size: 0.05 },
    { location: [41.0082, 28.9784], size: 0.06 },
  ],
}

export function Globe({
  className,
  config = GLOBE_CONFIG,
}: {
  className?: string
  config?: COBEOptions
}) {
  let phi = 0
  let width = 0
  let scale = 1
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<number | null>(null)
  const pointerInteractionMovement = useRef(0)
  const globeInstance = useRef<ReturnType<typeof createGlobe> | null>(null)
  const { theme } = useTheme()

  const entry = useIntersectionObserver(containerRef, {
    threshold: 0.2,
    rootMargin: "50px",
  })
  const isVisible = !!entry?.isIntersecting

  const controls = useAnimation()
  const r = useMotionValue(0)
  const rs = useSpring(r, {
    mass: 1,
    damping: 30,
    stiffness: 100,
  })

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab"
    }
  }

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current
      pointerInteractionMovement.current = delta
      r.set(r.get() + delta / MOVEMENT_DAMPING)
    }
  }

  useEffect(() => {
    if (!isVisible || !canvasRef.current) return

    const onResize = () => {
      if (canvasRef.current) {
        if (canvasRef.current.offsetWidth > 450) {
          width = canvasRef.current.offsetWidth
        } else {
          width = 450
          scale = 2.3
        }
      }
    }

    window.addEventListener("resize", onResize)
    onResize()

    if (globeInstance.current) {
      globeInstance.current.destroy()
    }

    globeInstance.current = createGlobe(canvasRef.current, {
      ...config,
      width: width * 2,
      height: width * 2,
      scale: scale,
      baseColor: theme === "dark" ? [0.15, 0.15, 0.15] : [1, 1, 1],
      markerColor:
        theme === "dark" ? [200 / 255, 155 / 255, 48 / 255] : [255 / 255, 197 / 255, 61 / 255],
      glowColor: theme === "dark" ? [0.3, 0.3, 0.3] : [0.5, 0.5, 0.5],
      dark: theme === "dark" ? 1 : 0,
      mapBrightness: theme === "dark" ? 12 : 5,
      diffuse: theme === "dark" ? 0.5 : 0.4,
      onRender: (state) => {
        if (!pointerInteracting.current) phi += 0.005
        state.phi = phi + rs.get()
        state.width = width * 2
        state.height = width * 2
      },
    })

    controls.start({
      opacity: 1,
      scale: 1,
      transition: { duration: 1, ease: "easeOut" },
    })

    return () => {
      if (globeInstance.current) {
        globeInstance.current.destroy()
      }
      window.removeEventListener("resize", onResize)
    }
  }, [isVisible, rs, config, controls, theme])

  return (
    <motion.div
      ref={containerRef}
      className={cn("absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[600px]", className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={controls}
    >
      <canvas
        className={cn("size-full [contain:layout_paint_size]")}
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX
          updatePointerInteraction(e.clientX)
        }}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) => e.touches[0] && updateMovement(e.touches[0].clientX)}
      />
    </motion.div>
  )
}
