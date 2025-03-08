import { NoopTinybird, Tinybird } from "@chronark/zod-bird"
import { z } from "zod"
import { auditLogSchemaV1, featureUsageSchemaV1, featureVerificationSchemaV1 } from "./validators"

export class Analytics {
  public readonly readClient: Tinybird | NoopTinybird
  public readonly writeClient: Tinybird | NoopTinybird
  public readonly isNoop: boolean

  constructor(opts: {
    emit: boolean
    tinybirdToken?: string
    tinybirdUrl: string
    tinybirdProxy?: {
      url: string
      token: string
    }
  }) {
    this.readClient =
      opts.tinybirdToken && opts.emit
        ? new Tinybird({ token: opts.tinybirdToken, baseUrl: opts.tinybirdUrl })
        : new NoopTinybird()

    this.writeClient =
      opts.tinybirdProxy && opts.emit
        ? new Tinybird({
            token: opts.tinybirdProxy.token,
            baseUrl: opts.tinybirdProxy.url,
          })
        : this.readClient

    this.isNoop = this.writeClient instanceof NoopTinybird
  }

  public get ingestSdkTelemetry() {
    return this.writeClient.buildIngestEndpoint({
      datasource: "sdk_telemetry",
      event: z.object({
        runtime: z.string(),
        platform: z.string(),
        versions: z.array(z.string()),
        requestId: z.string(),
        time: z.number(),
      }),
    })
  }

  public get ingestGenericAuditLogs() {
    return this.writeClient.buildIngestEndpoint({
      datasource: "audit_logs__v2",
      event: auditLogSchemaV1.transform((l) => ({
        ...l,
        meta: l.meta ? JSON.stringify(l.meta) : undefined,
        actor: {
          ...l.actor,
          meta: l.actor.meta ? JSON.stringify(l.actor.meta) : undefined,
        },
        resources: JSON.stringify(l.resources),
      })),
    })
  }

  public get ingestFeaturesVerification() {
    return this.writeClient.buildIngestEndpoint({
      datasource: "feature_verifications",
      event: featureVerificationSchemaV1,
      // we need to wait for the ingestion to be done before returning
      wait: true,
    })
  }

  public get ingestFeaturesUsage() {
    return this.writeClient.buildIngestEndpoint({
      datasource: "feature_usage_records",
      event: featureUsageSchemaV1,
      // we need to wait for the ingestion to be done before returning
      wait: true,
    })
  }
  public get getFeaturesVerifications() {
    return this.readClient.buildPipe({
      pipe: "get_feature_verifications",
      parameters: z.object({
        projectId: z.string().optional(),
        customerId: z.string().optional(),
        entitlementId: z.string().optional(),
        featureSlug: z.string().optional(),
        start: z.number().optional(),
        end: z.number().optional(),
      }),
      data: z.object({
        projectId: z.string(),
        customerId: z.string().optional(),
        entitlementId: z.string().optional(),
        featureSlug: z.string(),
        count: z.number(),
        p95_latency: z.number(),
        max_latency: z.number(),
        latest_latency: z.number(),
      }),
      opts: {
        cache: "no-store",
      },
    })
  }

  public get getFeaturesUsage() {
    return this.readClient.buildPipe({
      pipe: "get_feature_usage_period",
      parameters: z.object({
        projectId: z.string().optional(),
        customerId: z.string().optional(),
        featureSlug: z.string().optional(),
        entitlementId: z.string().optional(),
        start: z.number().optional(),
        end: z.number().optional(),
      }),
      data: z.object({
        projectId: z.string(),
        customerId: z.string().optional(),
        entitlementId: z.string().optional(),
        featureSlug: z.string(),
        count: z.number(),
        sum: z.number(),
        max: z.number(),
        last_during_period: z.number(),
      }),
      opts: {
        cache: "no-store",
        // cache for 1 day
        // next: {
        //   revalidate: 60 * 60 * 24, // 1 day
        // },
      },
    })
  }

  public get getBillingUsage() {
    return this.readClient.buildPipe({
      pipe: "get_feature_usage_no_duplicates",
      parameters: z.object({
        subscriptionItemId: z.string(),
        customerId: z.string(),
        projectId: z.string(),
        start: z.number().optional(),
        end: z.number().optional(),
      }),
      data: z.object({
        projectId: z.string(),
        customerId: z.string().optional(),
        subscriptionItemId: z.string().optional(),
        featureSlug: z.string(),
        sum: z.number(),
        max: z.number(),
        count: z.number(),
        last_during_period: z.number(),
      }),
      opts: {
        cache: "no-store",
      },
    })
  }
}
