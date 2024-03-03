import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { eq } from "@builderai/db"
import { domains } from "@builderai/db/schema"
import { newIdEdge } from "@builderai/db/utils"
import type { DomainVerificationStatusProps } from "@builderai/db/validators"
import {
  domainAddSchema,
  domainResponseSchema,
  domainSelectBaseSchema,
  domainVerificationStatusSchema,
} from "@builderai/db/validators"

import {
  createTRPCRouter,
  protectedActiveWorkspaceAdminProcedure,
} from "../../trpc"
import {
  addDomainToVercel,
  getConfigResponseVercel,
  getDomainResponseVercel,
  removeDomainFromVercelProject,
  verifyDomainVercel,
} from "../../utils/vercel-api"

export const domainRouter = createTRPCRouter({
  exists: protectedActiveWorkspaceAdminProcedure
    .input(z.object({ domain: z.string() }))
    .output(z.object({ exist: z.boolean() }))
    .query(async (opts) => {
      const domain = await opts.ctx.db.query.domains.findFirst({
        where: (d, { eq }) => eq(d.name, opts.input.domain),
      })

      return {
        exist: !!domain,
      }
    }),
  create: protectedActiveWorkspaceAdminProcedure
    .input(domainAddSchema)
    .output(z.object({ domain: domainSelectBaseSchema }))
    .mutation(async (opts) => {
      // validate the domain
      const workspace = opts.ctx.workspace
      const domain = opts.input.name

      // TODO: validate domain

      // verify the domain is not already added in our system
      const domainExist = await opts.ctx.db.query.domains.findFirst({
        where: (d, { eq }) => eq(d.name, domain),
      })

      if (domainExist) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Domain already exists",
        })
      }

      // verify the domain is not already added in vercel
      const data = await addDomainToVercel(domain)

      if (data.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: data.error.message,
        })
      }

      if (!data.apexName || !data.name) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error adding domain",
        })
      }

      const domainId = newIdEdge("domain")

      const domainData = await opts.ctx.db
        .insert(domains)
        .values({
          id: domainId,
          name: data.name,
          apexName: data.apexName,
          workspaceId: workspace.id,
        })
        .returning()
        .then((res) => res[0])

      if (!domainData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error adding domain",
        })
      }

      return { domain: domainData }
    }),
  removeDomain: protectedActiveWorkspaceAdminProcedure
    .input(z.object({ id: z.string() }))
    .output(
      z.object({
        domain: domainSelectBaseSchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const workspace = opts.ctx.workspace
      const domain = await opts.ctx.db.query.domains.findFirst({
        where: (d, { eq, and }) =>
          and(eq(d.id, opts.input.id), eq(d.workspaceId, workspace.id)),
      })

      if (!domain) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Domain not found",
        })
      }

      const data = await removeDomainFromVercelProject(domain.name)

      if (data?.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: data.error.message,
        })
      }

      const deletedDomain = await opts.ctx.db
        .delete(domains)
        .where(eq(domains.id, domain.id))
        .returning()
        .then((res) => res[0])

      return {
        domain: deletedDomain,
      }
    }),

  getDomains: protectedActiveWorkspaceAdminProcedure
    .input(z.void())
    .output(z.array(domainSelectBaseSchema))
    .query(async (opts) => {
      const workspace = opts.ctx.workspace

      const domains = await opts.ctx.db.query.domains.findMany({
        where: (d, { eq }) => eq(d.workspaceId, workspace.id),
      })

      return domains
    }),

  verify: protectedActiveWorkspaceAdminProcedure
    .input(z.object({ domain: z.string() }))
    .output(
      z.object({
        status: domainVerificationStatusSchema,
        domainJson: domainResponseSchema.optional(),
      })
    )
    .query(async (opts) => {
      let status: DomainVerificationStatusProps = "Valid Configuration"

      const [domainJson, configJson] = await Promise.all([
        getDomainResponseVercel(opts.input.domain),
        getConfigResponseVercel(opts.input.domain),
      ])

      if (domainJson?.error?.code === "not_found") {
        // domain not found on Vercel project
        status = "Domain Not Found"
      } else if (domainJson.error) {
        status = "Unknown Error"
      } else if (!domainJson.verified) {
        status = "Pending Verification"
        const verificationJson = await verifyDomainVercel(opts.input.domain)

        if (verificationJson.verified) {
          status = "Valid Configuration"
        }
      } else if (configJson.misconfigured) {
        status = "Invalid Configuration"
      }

      return {
        status,
        domainJson,
      }
    }),
})
