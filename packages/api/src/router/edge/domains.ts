import { z } from "zod"

import { env } from "../../env.mjs"
import {
  createTRPCRouter,
  protectedActiveWorkspaceAdminProcedure,
} from "../../trpc"

export const domainConfigResponseSchema = z.object({
  configuredBy: z
    .union([z.literal("CNAME"), z.literal("A"), z.literal("http")])
    .optional()
    .nullable(),
  acceptedChallenges: z
    .array(z.union([z.literal("dns-01"), z.literal("http-01")]))
    .optional()
    .nullable(),
  misconfigured: z.boolean(),
})

export const domainResponseSchema = z.object({
  name: z.string().optional(),
  apexName: z.string().optional(),
  projectId: z.string().optional(),
  redirect: z.string().optional().nullable(),
  redirectStatusCode: z
    .union([z.literal(307), z.literal(301), z.literal(302), z.literal(308)])
    .optional()
    .nullable(),
  gitBranch: z.string().optional().nullable(),
  updatedAt: z.number().optional(),
  createdAt: z.number().optional(),
  verified: z.boolean().optional(),
  configVerifiedAt: z.number().optional().nullable(),
  verification: z
    .array(
      z.object({
        type: z.string(),
        domain: z.string(),
        value: z.string(),
        reason: z.string(),
      })
    )
    .optional(),
})

export type DomainVerificationResponse = z.infer<typeof domainResponseSchema>
export type DomainConfigResponse = z.infer<typeof domainConfigResponseSchema>
export type DomainResponse = z.infer<typeof domainResponseSchema>
export type DomainVerificationStatusProps =
  | "Valid Configuration"
  | "Invalid Configuration"
  | "Pending Verification"
  | "Domain Not Found"
  | "Unknown Error"

export const domainRouter = createTRPCRouter({
  addDomainToVercel: protectedActiveWorkspaceAdminProcedure
    .input(z.object({ domain: z.string() }))
    .mutation(async (opts) => {
      const data = await fetch(
        `https://api.vercel.com/v9/projects/${env.PROJECT_ID_VERCEL}/domains?teamId=${env.TEAM_ID_VERCEL}`,
        {
          body: `{\n  "name": "${opts.input.domain}"\n}`,
          headers: {
            Authorization: `Bearer ${env.VERCEL_AUTH_BEARER_TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      )
      return domainResponseSchema.parse(await data.json())
    }),
  removeDomainFromVercelProject: protectedActiveWorkspaceAdminProcedure
    .input(z.object({ domain: z.string() }))
    .mutation(async (opts) => {
      const data = await fetch(
        `https://api.vercel.com/v9/projects/${env.PROJECT_ID_VERCEL}/domains/${opts.input.domain}?teamId=${env.TEAM_ID_VERCEL}`,
        {
          headers: {
            Authorization: `Bearer ${env.VERCEL_AUTH_BEARER_TOKEN}`,
          },
          method: "DELETE",
        }
      )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return await data.json()
    }),
  // removeDomainFromVercelTeam: protectedActiveWorkspaceAdminProcedure
  //   .input(z.object({ domain: z.string() }))
  //   .mutation(async (opts) => {
  //     const data = await fetch(
  //       `https://api.vercel.com/v6/domains/${opts.input.domain}?teamId=${env.TEAM_ID_VERCEL}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${env.VERCEL_AUTH_BEARER_TOKEN}`,
  //         },
  //         method: "DELETE",
  //       },
  //     );
  //     return await data.json();
  //   }),
  getDomainResponse: protectedActiveWorkspaceAdminProcedure
    .input(z.object({ domain: z.string() }))
    .query(async (opts) => {
      const data = await fetch(
        `https://api.vercel.com/v9/projects/${env.PROJECT_ID_VERCEL}/domains/${opts.input.domain}?teamId=${env.TEAM_ID_VERCEL}`,
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
        .parse(data.json())
      return result
    }),
  getConfigResponse: protectedActiveWorkspaceAdminProcedure
    .input(z.object({ domain: z.string() }))
    .query(async (opts) => {
      const data = await fetch(
        `https://api.vercel.com/v6/domains/${opts.input.domain}/config?teamId=${env.TEAM_ID_VERCEL}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${env.VERCEL_AUTH_BEARER_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      )
      const result = domainConfigResponseSchema.parse(await data.json())
      return result
    }),
  getDomains: protectedActiveWorkspaceAdminProcedure
    .input(z.void())
    .output(
      z.array(
        domainResponseSchema.extend({
          verificationStatus: z.string().optional(),
        })
      )
    )
    .query(async (_opts) => {
      const data = await fetch(
        `https://api.vercel.com/v5/domains?limit=20&teamId=${env.TEAM_ID_VERCEL}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${env.VERCEL_AUTH_BEARER_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      )

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const json = await data.json()

      const result = domainResponseSchema
        .extend({
          error: z
            .object({
              code: z.string(),
              message: z.string(),
            })
            .optional(),
        })
        .array()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .parse(json?.domains ?? [])
      return result
    }),
  verifyDomain: protectedActiveWorkspaceAdminProcedure
    .input(z.object({ domain: z.string() }))
    .query(async (opts) => {
      const data = await fetch(
        `https://api.vercel.com/v9/projects/${env.PROJECT_ID_VERCEL}/domains/${opts.input.domain}/verify?teamId=${env.TEAM_ID_VERCEL}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.VERCEL_AUTH_BEARER_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      )

      const result = domainResponseSchema.parse(data.json())
      return result
    }),
})
