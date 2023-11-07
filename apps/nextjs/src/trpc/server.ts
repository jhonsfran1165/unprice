"use server"

import { headers } from "next/headers"
import { loggerLink } from "@trpc/client"
import { experimental_createTRPCNextAppDirServer } from "@trpc/next/app-dir/server"

import type { AppRouter } from "@builderai/api"

import { endingLinkServer, transformer } from "./shared"

export const api = experimental_createTRPCNextAppDirServer<AppRouter>({
  config() {
    return {
      transformer,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        endingLinkServer({
          headers: () => {
            const h = new Map(headers())
            h.delete("connection")
            h.delete("transfer-encoding")
            h.set("x-trpc-source", "rsc-http")
            return Object.fromEntries(h.entries())
          },
        }),
      ],
    }
  },
})

export { type RouterInputs, type RouterOutputs } from "@builderai/api"
