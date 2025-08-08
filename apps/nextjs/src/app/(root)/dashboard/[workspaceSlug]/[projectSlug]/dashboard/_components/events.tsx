"use client"

import type { AnalyticsEventAction } from "@unprice/analytics"
import { API_DOMAIN } from "@unprice/config"
import { ScrollArea } from "@unprice/ui/scroll-area"
import { format } from "date-fns"
import { AnimatePresence, motion } from "framer-motion"
import { BarChart2 } from "lucide-react"
import { usePartySocket } from "partysocket/react"
import { useCallback, useState } from "react"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { Notification } from "~/components/landing/notification"

interface EventMessage {
  id: string
  data: string
  receivedAt: number
}

interface ParsedEventData {
  action: AnalyticsEventAction
  session_id: string
  name: string
  description: string
  timestamp: Date
}

export const EventsEmptyState = ({
  isLoading = false,
}: {
  isLoading?: boolean
}) => {
  return (
    <EmptyPlaceholder className="h-[450px] w-full" isLoading={isLoading}>
      <EmptyPlaceholder.Icon>
        <BarChart2 className="h-8 w-8 opacity-30" />
      </EmptyPlaceholder.Icon>
      <EmptyPlaceholder.Title>No events yet</EmptyPlaceholder.Title>
      <EmptyPlaceholder.Description>Events will appear here.</EmptyPlaceholder.Description>
    </EmptyPlaceholder>
  )
}

export function Events({
  sessionToken,
  projectId,
  workspaceSlug,
  projectSlug,
  initialEvents,
}: {
  sessionToken: string
  projectId: string
  workspaceSlug: string
  projectSlug: string
  initialEvents?: ParsedEventData[]
}) {
  const [events, setEvents] = useState<ParsedEventData[]>(initialEvents ?? [])

  const handleMessage = useCallback((event: EventMessage) => {
    const data = JSON.parse(event.data) as {
      customerId: string
      featureSlug: string
      success: boolean
      type: string
    }

    setEvents((prev) => {
      const newEvents = [
        {
          action: data.type as AnalyticsEventAction,
          session_id: data.customerId,
          name: data.featureSlug,
          description: data.success ? "Success" : "Failed",
          timestamp: new Date(),
        },
        ...prev.slice(0, 12), // up to 13 events
      ]
      return newEvents
    })
  }, [])

  usePartySocket({
    host: API_DOMAIN.replace("https://", "wss://").replace("http://", "ws://"),
    room: projectId,
    prefix: "broadcast",
    party: "projectdo",
    query: { sessionToken },
    onMessage: (event) => handleMessage(event as unknown as EventMessage),
  })

  return (
    <div className="items-start rounded-md bg-background">
      <ScrollArea className="h-[500px] w-full ">
        <AnimatePresence initial={false}>
          {events.map((event) => {
            // const { badge, icon } = getTypeStyles(event.data.action)
            const customerHref = `/${workspaceSlug}/${projectSlug}/customers/${event.session_id}`

            return (
              <motion.div
                key={Math.random().toString()}
                initial={{
                  x: -100,
                  opacity: 0,
                }}
                animate={{
                  x: 0,
                  opacity: 1,
                  transition: {
                    x: { type: "spring", stiffness: 300, damping: 24 },
                    opacity: { duration: 0.2 },
                  },
                }}
                layout="position"
                className="px-2 py-1"
              >
                <Notification
                  size="sm"
                  name={event.name}
                  description={event.description}
                  icon={"💬"}
                  color={"#e54d2e"}
                  time={format(event.timestamp, "MMM d, hh:mm a")}
                  href={customerHref}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </ScrollArea>
      {events.length === 0 && <EventsEmptyState />}
    </div>
  )
}
