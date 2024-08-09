"use client"

import { type RefObject, useCallback, useEffect, useState } from "react"
import { useResizeObserver } from "./use-resize-observer"

export function useScrollProgress(ref: RefObject<HTMLElement>, selector?: string) {
  const [scrollProgress, setScrollProgress] = useState(1)
  const scrollableElement = selector
    ? (ref.current?.querySelector(selector) as HTMLElement)
    : ref.current

  const updateScrollProgress = useCallback(() => {
    if (!scrollableElement) return

    const { scrollTop, scrollHeight, clientHeight } = scrollableElement

    // scroll progress is 1 when the scrollable element is at the bottom
    // or when there is no scrollable space
    const isScrollable = scrollHeight > clientHeight
    const scrollProgress = isScrollable ? Math.min(scrollTop / (scrollHeight - clientHeight), 1) : 1

    setScrollProgress(scrollProgress)
  }, [scrollableElement])

  const resizeObserverEntry = useResizeObserver(ref)

  useEffect(updateScrollProgress, [resizeObserverEntry])

  return { scrollProgress, updateScrollProgress }
}
