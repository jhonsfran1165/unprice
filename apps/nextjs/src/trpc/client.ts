"use client"

import { loggerLink } from "@trpc/client"
import { experimental_createTRPCNextAppDirClient } from "@trpc/next/app-dir/client"
import { createTRPCReact } from "@trpc/react-query"

import type { AppRouter } from "@builderai/api"

import { endingLink, transformer } from "./shared"

export const apiRQ = createTRPCReact<AppRouter>()

export const api = experimental_createTRPCNextAppDirClient<AppRouter>({
  config() {
    return {
      transformer,
      links: [
        loggerLink({
          enabled: (opts) =>
            (process.env.NODE_ENV === "development" &&
              process.env.DEBUG === "on") ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        endingLink({
          headers: {
            "x-trpc-source": "client",
          },
        }),
      ],
    }
  },
})

export { type RouterInputs, type RouterOutputs } from "@builderai/api"
