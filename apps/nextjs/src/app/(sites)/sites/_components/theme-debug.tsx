"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeDebug() {
  const [cssVars, setCssVars] = useState<Record<string, string>>({})
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const updateCssVars = () => {
      const computedStyle = getComputedStyle(document.documentElement)
      const vars = {
        "--background": computedStyle.getPropertyValue("--background"),
        "--foreground": computedStyle.getPropertyValue("--foreground"),
        "--card": computedStyle.getPropertyValue("--card"),
        "--card-foreground": computedStyle.getPropertyValue("--card-foreground"),
        "--pricing-highlight": computedStyle.getPropertyValue("--pricing-highlight"),
        "--pricing-highlight-foreground": computedStyle.getPropertyValue(
          "--pricing-highlight-foreground"
        ),
        "--pricing-discount": computedStyle.getPropertyValue("--pricing-discount"),
        "--pricing-discount-foreground": computedStyle.getPropertyValue(
          "--pricing-discount-foreground"
        ),
      }
      setCssVars(vars)
    }

    updateCssVars()

    // Set up a mutation observer to watch for class changes on the document element
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          updateCssVars()
        }
      }
    })

    observer.observe(document.documentElement, { attributes: true })

    return () => observer.disconnect()
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed right-4 bottom-4 z-50 max-w-xs rounded-lg bg-black/80 p-4 text-white text-xs">
      <h3 className="mb-2 font-bold">Theme Debug</h3>
      <div className="space-y-1">
        <div>Theme: {theme}</div>
        <div>Resolved: {resolvedTheme}</div>
        {Object.entries(cssVars).map(([key, value]) => (
          <div key={key}>
            <span className="opacity-70">{key}:</span> {value}
          </div>
        ))}
      </div>
      <div className="mt-2 opacity-70">Classes: {document.documentElement.className}</div>
    </div>
  )
}
