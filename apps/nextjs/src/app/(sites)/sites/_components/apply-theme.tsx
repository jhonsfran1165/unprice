"use client"

import { useEffect, useState } from "react"

function setColor(color: string, name: string) {
  document.documentElement.style.setProperty(`--${name}`, color)
}

export function ApplyTheme({
  cssVars,
}: {
  cssVars?: Record<string, string>
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const updateCssVars = () => {
      if (!cssVars) return

      Object.entries(cssVars).forEach(([key, value]) => {
        setColor(value, key)
      })
    }

    updateCssVars()
  }, [])

  if (!mounted) return null

  return null
}
