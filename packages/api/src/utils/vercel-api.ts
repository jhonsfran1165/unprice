import { z } from "zod"

import {
  domainConfigResponseSchema,
  domainResponseSchema,
} from "@builderai/db/validators"

import { env } from "../env.mjs"

export const addDomainToVercel = async (domain: string) => {
  const data = await fetch(
    `https://api.vercel.com/v9/projects/${env.PROJECT_ID_VERCEL}/domains?teamId=${env.TEAM_ID_VERCEL}`,
    {
      body: `{\n  "name": "${domain}"\n}`,
      headers: {
        Authorization: `Bearer ${env.VERCEL_AUTH_BEARER_TOKEN}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  )
  return domainResponseSchema
    .extend({
      error: z
        .object({
          code: z.string(),
          message: z.string(),
        })
        .optional(),
    })
    .parse(await data.json())
}

export const removeDomainFromVercelProject = async (domain: string) => {
  const data = await fetch(
    `https://api.vercel.com/v9/projects/${env.PROJECT_ID_VERCEL}/domains/${domain}?teamId=${env.TEAM_ID_VERCEL}`,
    {
      headers: {
        Authorization: `Bearer ${env.VERCEL_AUTH_BEARER_TOKEN}`,
      },
      method: "DELETE",
    }
  )

  const result = z
    .object({})
    .extend({
      error: z
        .object({
          code: z.string(),
          message: z.string(),
        })
        .optional(),
    })
    .optional()
    .parse(await data.json())

  return result
}

export const verifyDomainVercel = async (domain: string) => {
  const data = await fetch(
    `https://api.vercel.com/v9/projects/${env.PROJECT_ID_VERCEL}/domains/${domain}/verify?teamId=${env.TEAM_ID_VERCEL}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.VERCEL_AUTH_BEARER_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  )

  const result = domainResponseSchema
    .extend({
      error: z
        .object({
          code: z.string(),
          message: z.string(),
        })
        .optional(),
    })
    .parse(await data.json())
  return result
}

export const getDomainResponseVercel = async (domain: string) => {
  const data = await fetch(
    `https://api.vercel.com/v9/projects/${env.PROJECT_ID_VERCEL}/domains/${domain}?teamId=${env.TEAM_ID_VERCEL}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.VERCEL_AUTH_BEARER_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  )

  const result = domainResponseSchema
    .extend({
      error: z
        .object({
          code: z.string(),
          message: z.string(),
        })
        .optional(),
    })
    .parse(await data.json())
  return result
}

export const getConfigResponseVercel = async (domain: string) => {
  const data = await fetch(
    `https://api.vercel.com/v6/domains/${domain}/config?teamId=${env.TEAM_ID_VERCEL}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.VERCEL_AUTH_BEARER_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  )
  const result = domainConfigResponseSchema
    .extend({
      error: z
        .object({
          code: z.string(),
          message: z.string(),
        })
        .optional(),
    })
    .parse(await data.json())
  return result
}
