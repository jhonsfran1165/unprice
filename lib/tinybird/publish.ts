import { z } from "zod"

import { tb } from "@/lib/tinybird/client"

// TODO: build pipe so I can start create the dashboard

export const publishPageHits = tb.buildIngestEndpoint({
  datasource: "page_views__v3",
  event: z.object({
    session_id: z.string(),
    domain: z.string(),
    subdomain: z.string(),
    path: z.string(),
    locale: z.string(),
    href: z.string(),
    ip: z.string(),
    time: z.number().int(),
    timestamp: z.string(),
    referer: z.string().optional().default("(direct)"),
    referer_url: z.string().optional().default("(direct)"),
    country: z.string().optional().default("Unknown"),
    city: z.string().optional().default("Unknown"),
    region: z.string().optional().default("Unknown"),
    latitude: z.string().optional().default("Unknown"),
    longitude: z.string().optional().default("Unknown"),
    useragent: z.string().optional().default("Unknown"),
    browser: z.string().optional().default("Unknown"),
    browser_version: z.string().optional().default("Unknown"),
    engine: z.string().optional().default("Unknown"),
    engine_version: z.string().optional().default("Unknown"),
    os: z.string().optional().default("Unknown"),
    os_version: z.string().optional().default("Unknown"),
    device: z.string().optional().default("Desktop"),
    device_vendor: z.string().optional().default("Unknown"),
    device_model: z.string().optional().default("Unknown"),
    cpu_architecture: z.string().optional().default("Unknown"),
    bot: z.boolean().optional(),
  }),
})
