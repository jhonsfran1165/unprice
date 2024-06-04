import { TRPCError } from "@trpc/server"
import { waitUntil } from "@vercel/functions"

import { eq, prepared } from "@builderai/db"
import * as schema from "@builderai/db/schema"

import type { Context } from "../trpc"

export const apikeyGuard = async ({
  apikey,
  ctx,
}: {
  apikey?: string | null
  ctx: Context
}) => {
  if (!apikey) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Api key not found in headers",
    })
  }

  // Check db for API key
  // TODO: does it make sense to cache this in redis
  const apiKeyData = await prepared.apiKeyPrepared.execute({
    apikey,
  })

  if (!apiKeyData) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Api key not found" })
  }

  if (apiKeyData.revokedAt !== null) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Api key is revoked" })
  }

  if (apiKeyData.expiresAt && apiKeyData.expiresAt < new Date()) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Api key is expired" })
  }

  if (apiKeyData.project.enabled === false) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Project is disabled and all API requests will be rejected. Please contact support",
    })
  }

  if (apiKeyData.project.workspace.enabled === false) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message:
        "Workspace is disabled and all API requests will be rejected. Please contact support",
    })
  }

  // update last used in background
  waitUntil(
    ctx.db
      .update(schema.apikeys)
      .set({
        lastUsed: new Date(),
      })
      .where(eq(schema.apikeys.id, apiKeyData.id))
      .execute()
  )

  return {
    apiKey: apiKeyData,
  }
}
