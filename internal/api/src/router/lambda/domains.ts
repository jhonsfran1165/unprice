import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq } from "@unprice/db"
import { domains } from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"
import type { DomainVerificationStatusProps } from "@unprice/db/validators"
import {
  domainCreateBaseSchema,
  domainSelectBaseSchema,
  domainUpdateBaseSchema,
  domainVerificationStatusSchema,
} from "@unprice/db/validators"
import { type Domain, Vercel } from "@unprice/vercel"

import { env } from "../../env.mjs"
import { createTRPCRouter, protectedWorkspaceProcedure } from "../../trpc"

export const domainRouter = createTRPCRouter({
  // INFO: defined as a mutation so we can call it asynchronously
  exists: protectedWorkspaceProcedure
    .input(z.object({ domain: z.string() }))
    .output(z.object({ exist: z.boolean() }))
    .mutation(async (opts) => {
      const domain = await opts.ctx.db.query.domains.findFirst({
        where: (d, { eq }) => eq(d.name, opts.input.domain),
      })

      return {
        exist: !!domain,
      }
    }),
  create: protectedWorkspaceProcedure
    .input(domainCreateBaseSchema.pick({ name: true }))
    .output(z.object({ domain: domainSelectBaseSchema }))
    .mutation(async (opts) => {
      // validate the domain
      const workspace = opts.ctx.workspace
      const domain = opts.input.name

      // only owner and admin can add a domain
      opts.ctx.verifyRole(["OWNER", "ADMIN"])

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
      const vercel = new Vercel({
        accessToken: env.VERCEL_AUTH_BEARER_TOKEN,
        teamId: env.TEAM_ID_VERCEL,
      })

      const response = await vercel.addProjectDomain(env.PROJECT_ID_VERCEL, domain)

      if (response.err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: response.err.message,
        })
      }

      const domainVercel = response.val

      if (!domainVercel.apexName || !domainVercel.name) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error adding domain to domain provider",
        })
      }

      const domainId = newId("domain")

      const domainData = await opts.ctx.db
        .insert(domains)
        .values({
          id: domainId,
          name: domainVercel.name,
          apexName: domainVercel.apexName,
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

  remove: protectedWorkspaceProcedure
    .input(z.object({ id: z.string() }))
    .output(
      z.object({
        domain: domainSelectBaseSchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const workspace = opts.ctx.workspace

      // only owner and admin can remove a domain
      opts.ctx.verifyRole(["OWNER", "ADMIN"])

      const domain = await opts.ctx.db.query.domains.findFirst({
        where: (d, { eq, and }) => and(eq(d.id, opts.input.id), eq(d.workspaceId, workspace.id)),
      })

      if (!domain) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Domain not found",
        })
      }

      // TODO: I also need to remove the domain from the vercel account
      // not that easy as delete it and we are done, but maybe that domain is used for another account
      // maybe with a cron job that verify if the domain is used by another account and then remove it from our account
      // for now, I will just remove it from the project
      const vercel = new Vercel({
        accessToken: env.VERCEL_AUTH_BEARER_TOKEN,
        teamId: env.TEAM_ID_VERCEL,
      })

      // remove the old domain from vercel
      const removeData = await vercel.removeProjectDomain(env.PROJECT_ID_VERCEL, domain.name)

      if (removeData.err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: removeData.err.message,
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
  update: protectedWorkspaceProcedure
    .input(domainUpdateBaseSchema)
    .output(z.object({ domain: domainSelectBaseSchema }))
    .mutation(async (opts) => {
      const workspace = opts.ctx.workspace
      const { id, name: domain } = opts.input

      // only owner and admin can update a domain
      opts.ctx.verifyRole(["OWNER", "ADMIN"])

      const oldDomain = await opts.ctx.db.query.domains.findFirst({
        where: (d, { eq, and }) => and(eq(d.id, id), eq(d.workspaceId, workspace.id)),
      })

      if (!oldDomain) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Domain not found",
        })
      }

      if (oldDomain.name === domain) {
        return { domain: oldDomain }
      }

      // verify if the new domain is already added in our system
      const newDomainExist = await opts.ctx.db.query.domains.findFirst({
        where: (d, { eq }) => eq(d.name, domain),
      })

      if (newDomainExist) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "New Domain already register in the system",
        })
      }

      const vercel = new Vercel({
        accessToken: env.VERCEL_AUTH_BEARER_TOKEN,
        teamId: env.TEAM_ID_VERCEL,
      })

      // remove the old domain from vercel
      const removeData = await vercel.removeProjectDomain(env.PROJECT_ID_VERCEL, oldDomain.name)

      if (removeData.err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: removeData.err.message,
        })
      }

      // add the new domain to vercel
      const addData = await vercel.addProjectDomain(env.PROJECT_ID_VERCEL, domain)

      if (addData.err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: addData.err.message,
        })
      }

      const updateDomain = await opts.ctx.db
        .update(domains)
        .set({
          name: domain,
        })
        .where(and(eq(domains.id, id), eq(domains.workspaceId, workspace.id)))
        .returning()
        .then((res) => res[0])

      if (!updateDomain) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error updating domain",
        })
      }

      return { domain: updateDomain }
    }),
  getAllByActiveWorkspace: protectedWorkspaceProcedure
    .input(z.void())
    .output(z.array(domainSelectBaseSchema))
    .query(async (opts) => {
      const workspace = opts.ctx.workspace

      const domains = await opts.ctx.db.query.domains.findMany({
        where: (d, { eq }) => eq(d.workspaceId, workspace.id),
      })

      return domains
    }),

  verify: protectedWorkspaceProcedure
    .input(z.object({ domain: z.string() }))
    .output(
      z.object({
        status: domainVerificationStatusSchema,
        domainProvider: z.custom<Domain>().optional(),
      })
    )
    .query(async (opts) => {
      let status: DomainVerificationStatusProps = "Valid Configuration"

      const vercel = new Vercel({
        accessToken: env.VERCEL_AUTH_BEARER_TOKEN,
        teamId: env.TEAM_ID_VERCEL,
      })

      const [domainVercel, configDomain] = await Promise.all([
        vercel.getProjectDomain(env.PROJECT_ID_VERCEL, opts.input.domain),
        vercel.getDomainConfig(opts.input.domain),
      ])

      if (domainVercel?.err?.code === "not_found") {
        // domain not found on Vercel project
        status = "Domain Not Found"
      } else if (domainVercel?.err) {
        status = "Unknown Error"
      } else if (!domainVercel?.val.verified) {
        status = "Pending Verification"

        const domainVerification = await vercel.verifyProjectDomain(
          env.PROJECT_ID_VERCEL,
          opts.input.domain
        )

        if (domainVerification.val?.verified) {
          status = "Valid Configuration"
        } else {
          status = "Pending Verification"
        }
      } else if (configDomain.val?.misconfigured) {
        status = "Invalid Configuration"
      }

      // update the domain status
      await opts.ctx.db
        .update(domains)
        .set({
          verified: status === "Valid Configuration",
        })
        .where(
          and(eq(domains.name, opts.input.domain), eq(domains.workspaceId, opts.ctx.workspace.id))
        )

      return {
        status,
        domainProvider: domainVercel.val,
      }
    }),
})
