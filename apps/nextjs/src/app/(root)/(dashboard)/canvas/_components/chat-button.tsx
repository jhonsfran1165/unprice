"use client"

import dynamic from "next/dynamic"
import { stopEventPropagation, track } from "@tldraw/tldraw"

import { Button } from "@builderai/ui/button"
import { LoadingAnimation } from "@builderai/ui/loading-animation"

import type { PreviewShape } from "./preview-page-shape"

const ChatDemo = dynamic(async () => (await import("./chat")).ChatDemo, {
  ssr: false,
  loading: () => (
    <Button
      variant="ghost"
      size="sm"
      role="combobox"
      aria-label="Select a project"
      className="relative justify-between"
    >
      <div className="absolute inset-1 opacity-25" />
      <LoadingAnimation variant={"inverse"} />
    </Button>
  ),
})

export const ShowChatButton = track(({ shape }: { shape: PreviewShape }) => {
  return (
    <button
      style={{
        all: "unset",
        position: "absolute",
        top: 120,
        right: -40,
        height: 40,
        width: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        pointerEvents: "all",
      }}
      onPointerDown={stopEventPropagation}
    >
      <ChatDemo shape={shape} />
    </button>
  )
})
