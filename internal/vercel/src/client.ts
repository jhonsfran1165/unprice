import { Err, FetchError, Ok, type Result } from "@builderai/error"
import { z } from "zod"

type VercelErrorResponse = {
  error: string
  message: string
}

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
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

export type ConfigDomain = z.infer<typeof domainConfigResponseSchema>
export type Project = z.infer<typeof projectSchema>
export type Domain = z.infer<typeof domainResponseSchema>

const environmentVariable = z.object({})
export type EnvironmentVariable = z.infer<typeof environmentVariable>

export class Vercel {
  private readonly baseUrl: string
  private readonly token: string
  private readonly teamId: string | null

  constructor(opts: { accessToken: string; baseUrl?: string; teamId?: string }) {
    this.baseUrl = opts.baseUrl ?? "https://api.vercel.com"
    this.token = opts.accessToken
    this.teamId = opts.teamId ?? null
  }

  private async fetch<TResult>(req: {
    method: "GET" | "POST" | "PUT" | "DELETE"
    path: string[]
    parameters?: Record<string, unknown>
    opts?: { cache?: RequestCache; revalidate?: number }
    body?: unknown
  }): Promise<Result<TResult, FetchError>> {
    const url = new URL(req.path.join("/"), this.baseUrl)
    try {
      if (req.parameters) {
        for (const [key, value] of Object.entries(req.parameters)) {
          if (typeof value === "undefined" || value === null) {
            continue
          }
          url.searchParams.set(key, value.toString())
        }
      }
      if (this.teamId) {
        url.searchParams.set("teamId", this.teamId)
      }
      const res = await fetch(url, {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: req.body ? JSON.stringify(req.body) : undefined,
        cache: req.opts?.cache,
        // @ts-ignore
        next: {
          revalidate: req.opts?.revalidate,
        },
      })
      if (!res.ok) {
        const error = (await res.json()) as VercelErrorResponse
        console.error(error)
        return Err(
          new FetchError({
            message: error.message,
            retry: true,
            context: {
              url: url.toString(),
              method: req.method,
            },
          })
        )
      }
      const body = await res.json()
      return Ok(body)
    } catch (e) {
      return Err(
        new FetchError({
          message: (e as Error).message,
          retry: true,
          context: {
            url: url.toString(),
            method: req.method,
          },
        })
      )
    }
  }

  public async getProject(projectId: string): Promise<Result<Project, FetchError>> {
    return this.fetch({
      method: "GET",
      path: ["v9", "projects", projectId],
    })
  }

  public async verifyProjectDomain(
    projectId: string,
    domain: string
  ): Promise<Result<Domain, FetchError>> {
    return await this.fetch({
      method: "POST",
      path: ["v9", "projects", projectId, "domains", domain, "verify"],
      body: {
        name: domain,
      },
    })
  }

  public async getProjectDomain(
    projectId: string,
    domain: string
  ): Promise<Result<Domain, FetchError>> {
    return await this.fetch({
      method: "GET",
      path: ["v9", "projects", projectId, "domains", domain],
    })
  }

  public async getDomainConfig(domain: string): Promise<Result<ConfigDomain, FetchError>> {
    return await this.fetch({
      method: "GET",
      path: ["v6", "domains", domain, "config"],
    })
  }

  public async addProjectDomain(
    projectId: string,
    domain: string
  ): Promise<Result<Domain, FetchError>> {
    return await this.fetch({
      method: "POST",
      path: ["v9", "projects", projectId, "domains"],
      body: {
        name: domain,
      },
    })
  }

  public async removeProjectDomain(
    projectId: string,
    domain: string
  ): Promise<Result<void, FetchError>> {
    return await this.fetch({
      method: "DELETE",
      path: ["v9", "projects", projectId, "domains", domain],
      body: {
        name: domain,
      },
    })
  }

  public async listProjects(): Promise<Result<Project[], FetchError>> {
    const res = await this.fetch<{ projects: Project[] }>({
      method: "GET",
      path: ["v9", "projects"],
    })
    if (res.err) {
      return Err(res.err)
    }

    return Ok(res.val.projects)
  }

  public async upsertEnvironmentVariable(
    projectId: string,
    environment: string,
    key: string,
    value: string,
    sensitive?: boolean
  ): Promise<Result<{ created: { id: string } }, FetchError>> {
    return await this.fetch({
      method: "POST",
      path: ["v10", "projects", projectId, "env"],
      parameters: { upsert: true },
      body: {
        key,
        value,
        type: sensitive ? (environment === "development" ? "encrypted" : "sensitive") : "plain",
        target: [environment],
      },
    })
  }

  public async removeEnvironmentVariable(
    projectId: string,
    envId: string
  ): Promise<Result<void, FetchError>> {
    return await this.fetch({
      method: "DELETE",
      path: ["v10", "projects", projectId, "env", envId],
    })
  }
}
