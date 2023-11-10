"use client"

import { createTRPCReact } from "@trpc/react-query"

import type { AppRouter } from "@builderai/api"

export const api = createTRPCReact<AppRouter>()

export { type RouterInputs, type RouterOutputs } from "@builderai/api"
