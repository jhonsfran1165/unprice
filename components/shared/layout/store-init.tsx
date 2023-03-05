"use client"

import { useRef } from "react"

import { useStore } from "@/lib/stores/layout"

function StoreInitializer({ contextHeader }: { contextHeader: string }) {
  const initialized = useRef(false)
  if (!initialized.current) {
    useStore.setState({ contextHeader })
    initialized.current = true
  }
  return null
}

export default StoreInitializer
