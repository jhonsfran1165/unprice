"use client"

import { API_DOMAIN } from "@unprice/config"
import { ScrollArea } from "@unprice/ui/scroll-area"
import { cn } from "@unprice/ui/utils" // if you have a cn utility
import { AnimatePresence, motion } from "framer-motion"
import { BarChart2, CheckCircle, XCircle } from "lucide-react"
import { usePartySocket } from "partysocket/react"
import { useCallback, useState } from "react"
import { useCustomerId } from "~/hooks/use-flags"

interface EventMessage {
  id: string
  data: string
  receivedAt: number
}

interface ParsedEventData {
  id: string
  receivedAt: number
  data: {
    featureSlug: string
    customerId: string
    type: "can" | "reportUsage"
    success: boolean
    deniedReason?: string
    limit?: number
    notifyUsage?: boolean
    usage?: number
  }
}

function getTypeStyles(type: ParsedEventData["data"]["type"], error: boolean) {
  if (type === "can" && error)
    return {
      badge: "bg-destructive/10 text-destructive border-destructive",
      label: "Denied",
      icon: <XCircle className="mr-1 h-4 w-4 text-destructive" />,
    }
  if (type === "can")
    return {
      badge: "bg-muted text-muted-foreground border-muted",
      label: "Verified",
      icon: <CheckCircle className="mr-1 h-4 w-4 text-muted-foreground" />,
    }
  // Usage event
  return {
    badge: "bg-primary/10 text-primary border-primary",
    label: "Usage",
    icon: <BarChart2 className="mr-1 h-4 w-4 text-primary" />,
  }
}

function renderEventContent(event: ParsedEventData) {
  const { type, featureSlug, usage, success, deniedReason } = event.data

  if (type === "can") {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className={cn("font-medium", !success && "text-destructive")}>{featureSlug}</span>
        {!success && deniedReason && (
          <span className="ml-1 text-destructive">({deniedReason})</span>
        )}
      </div>
    )
  }

  // Usage event
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-medium">{featureSlug}</span>
      <span className="font-mono">{typeof usage === "number" ? usage.toLocaleString() : "-"}</span>
    </div>
  )
}

export function Events({ sessionToken }: { sessionToken: string }) {
  const customerId = useCustomerId()
  const [events, setEvents] = useState<ParsedEventData[]>([])

  const handleMessage = useCallback((event: EventMessage) => {
    const data = JSON.parse(event.data) as ParsedEventData["data"]
    setEvents((prev) => [
      {
        id: Math.random().toString(36).substring(2, 15),
        data,
        receivedAt: Date.now(),
      },
      ...prev.slice(0, 19), // up to 20 events
    ])
  }, [])

  usePartySocket({
    host: API_DOMAIN.replace("https://", "wss://").replace("http://", "ws://"),
    room: customerId,
    prefix: "broadcast",
    party: "usagelimit",
    query: { sessionToken },
    onMessage: (event) => handleMessage(event as unknown as EventMessage),
  })

  return (
    <ScrollArea className="h-[500px] w-full rounded-md border bg-background">
      <div className="divide-y divide-border">
        <AnimatePresence initial={false}>
          {events.map((event) => {
            const error = event.data.type === "can" && !event.data.success
            const { badge, label, icon } = getTypeStyles(event.data.type, error)
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="flex items-center gap-2 px-3 py-2"
              >
                <span
                  className={cn(
                    "inline-flex items-center rounded border px-2 py-0.5 font-medium text-xs",
                    badge
                  )}
                >
                  {icon}
                  {label}
                </span>
                <span className="ml-2 flex-1">{renderEventContent(event)}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
        {events.length === 0 && (
          <div className="flex h-[450px] flex-col items-center justify-center py-12 text-muted-foreground">
            <BarChart2 className="mb-2 h-8 w-8 opacity-30" />
            <span className="font-medium text-sm">No events yet</span>
            <span className="mt-1 text-xs">Events will appear here.</span>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
