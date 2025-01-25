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
      datasource: "sdk_telemetry__v1",
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
      datasource: "features_verifications__v2",
      event: featureVerificationSchemaV1,
    })
  }

  public get ingestFeaturesUsage() {
    return this.writeClient.buildIngestEndpoint({
      datasource: "features_usage__v2",
      event: featureUsageSchemaV1,
      wait: true,
    })
  }
  public get getFeaturesVerifications() {
    return this.readClient.buildPipe({
      pipe: "get_features_verifications__v1",
      parameters: z.object({
        projectId: z.string(),
        start: z.number(),
        end: z.number(),
      }),
      data: z.object({
        featureSlug: z.string(),
        total: z.number(),
      }),
      opts: {
        cache: "no-store",
      },
    })
  }

  public get getTotalUsagePerEntitlementPeriod() {
    return this.readClient.buildPipe({
      pipe: "get_total_usage_per_entitlement_period__v1",
      parameters: z.object({
        entitlementId: z.string(),
        customerId: z.string(),
        projectId: z.string(),
        start: z.number(),
        end: z.number(),
      }),
      data: z.object({
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

  public get getTotalUsagePerEntitlementAll() {
    return this.readClient.buildPipe({
      pipe: "get_total_usage_per_entitlement_all__v1",
      parameters: z.object({
        entitlementId: z.string(),
        customerId: z.string(),
        projectId: z.string(),
      }),
      data: z.object({
        sum_all: z.number(),
        count_all: z.number(),
        max_all: z.number(),
      }),
    })
  }

  public get getTotalUsagePerBillableFeaturePeriod() {
    return this.readClient.buildPipe({
      pipe: "get_total_usage_per_billable_feature_period__v1",
      parameters: z.object({
        subscriptionItemId: z.string(),
        customerId: z.string(),
        projectId: z.string(),
        start: z.number(),
        end: z.number(),
      }),
      data: z.object({
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

  public get getTotalUsagePerBillableFeatureAll() {
    return this.readClient.buildPipe({
      pipe: "get_total_usage_per_billable_feature_all__v1",
      parameters: z.object({
        subscriptionItemId: z.string(),
        customerId: z.string(),
        projectId: z.string(),
      }),
      data: z.object({
        sum_all: z.number(),
        count_all: z.number(),
        max_all: z.number(),
      }),
      opts: {
        cache: "no-store",
      },
    })
  }

  public get getTotalUsagePerFeature() {
    return this.readClient.buildPipe({
      pipe: "get_total_usage_per_feature__v1",
      parameters: z.object({
        featureSlug: z.string(),
        subscriptionItemId: z.string().optional(),
        customerId: z.string(),
        projectId: z.string(),
        start: z.number(),
        end: z.number(),
      }),
      data: z.object({
        sum: z.number(),
        max: z.number(),
        count: z.number(),
        last_during_period: z.number(),
        sum_all: z.number(),
        count_all: z.number(),
        max_all: z.number(),
      }),
      opts: {
        cache: "no-store",
      },
    })
  }

  public get getTotalUsagePerCustomer() {
    return this.readClient.buildPipe({
      pipe: "get_total_usage_customer__v1",
      parameters: z.object({
        customerId: z.string(),
        subscriptionId: z.string(),
        projectId: z.string(),
        start: z.number(),
        end: z.number(),
        type: z.enum(["period", "all"]),
      }),
      data: z.object({
        featureSlug: z.string(),
        sum: z.number().optional(),
        max: z.number().optional(),
        count: z.number().optional(),
        last_during_period: z.number().optional(),
        sum_all: z.number().optional(),
        count_all: z.number().optional(),
        max_all: z.number().optional(),
      }),
      opts: {
        cache: "no-store",
      },
    })
  }

  public get getTotalUsagePerProject() {
    return this.readClient.buildPipe({
      pipe: "get_total_usage_per_project__v1",
      parameters: z.object({
        projectId: z.string(),
        start: z.number(),
        end: z.number(),
      }),
      data: z.object({
        featureSlug: z.string(),
        sum: z.number(),
        max: z.number(),
        count: z.number(),
        last_during_period: z.number(),
      }),
    })
  }
}
