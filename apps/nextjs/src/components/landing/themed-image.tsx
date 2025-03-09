"use client"

import { useTheme } from "next-themes"
import Image from "next/image"
import { useEffect, useState } from "react"

const ThemedImage = ({
  lightSrc,
  darkSrc,
  alt,
  width,
  height,
  className,
}: {
  lightSrc: string
  darkSrc: string
  alt: string
  width: number
  height: number
  className?: string
}) => {
  const { theme } = useTheme()
  const [src, setSrc] = useState<string>(lightSrc)

  useEffect(() => {
    switch (theme) {
      case "light":
        setSrc(lightSrc)
        break
      case "dark":
        setSrc(darkSrc)
        break
      default:
        setSrc(lightSrc)
        break
    }
  }, [theme])

  return <Image src={src} alt={alt} width={width} height={height} className={className} priority />
}

export default ThemedImage
