import { z } from "zod"

import { createTRPCRouter, protectedWorkspaceAdminProcedure } from "../../trpc"

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
  addDomainToVercel: protectedWorkspaceAdminProcedure
    .input(z.object({ domain: z.string() }))
    .mutation(async (opts) => {
      const data = await fetch(
        `https://api.vercel.com/v9/projects/${process.env.PROJECT_ID_VERCEL}/domains?teamId=${process.env.TEAM_ID_VERCEL}`,
        {
          body: `{\n  "name": "${opts.input.domain}"\n}`,
          headers: {
            Authorization: `Bearer ${process.env.VERCEL_AUTH_BEARER_TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const json = await data.json()
      return domainResponseSchema.parse(json)
    }),
  removeDomainFromVercelProject: protectedWorkspaceAdminProcedure
    .input(z.object({ domain: z.string() }))
    .mutation(async (opts) => {
      const data = await fetch(
        `https://api.vercel.com/v9/projects/${process.env.PROJECT_ID_VERCEL}/domains/${opts.input.domain}?teamId=${process.env.TEAM_ID_VERCEL}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.VERCEL_AUTH_BEARER_TOKEN}`,
          },
          method: "DELETE",
        }
      )

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return await data.json()
    }),
  // removeDomainFromVercelTeam: protectedWorkspaceAdminProcedure
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
  getDomains: protectedWorkspaceAdminProcedure.query(async (opts) => {
    const data = await fetch(
      `https://api.vercel.com/v9/projects/${process.env.PROJECT_ID_VERCEL}/domains?teamId=${process.env.TEAM_ID_VERCEL}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_AUTH_BEARER_TOKEN}`,
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
      .parse(json?.domains ?? [])
    return result
  }),
  getDomainResponse: protectedWorkspaceAdminProcedure
    .input(z.object({ domain: z.string() }))
    .query(async (opts) => {
      const data = await fetch(
        `https://api.vercel.com/v9/projects/${process.env.PROJECT_ID_VERCEL}/domains/${opts.input.domain}?teamId=${process.env.TEAM_ID_VERCEL}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.VERCEL_AUTH_BEARER_TOKEN}`,
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
        .parse(json)
      return result
    }),
  getConfigResponse: protectedWorkspaceAdminProcedure
    .input(z.object({ domain: z.string() }))
    .query(async (opts) => {
      const data = await fetch(
        `https://api.vercel.com/v6/domains/${opts.input.domain}/config?teamId=${process.env.TEAM_ID_VERCEL}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.VERCEL_AUTH_BEARER_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const json = await data.json()
      const result = domainConfigResponseSchema.parse(json)
      return result
    }),
  verifyDomain: protectedWorkspaceAdminProcedure
    .input(z.object({ domain: z.string() }))
    .query(async (opts) => {
      const data = await fetch(
        `https://api.vercel.com/v9/projects/${process.env.PROJECT_ID_VERCEL}/domains/${opts.input.domain}/verify?teamId=${process.env.TEAM_ID_VERCEL}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.VERCEL_AUTH_BEARER_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const json = await data.json()
      const result = domainResponseSchema.parse(json)
      return result
    }),
})
