import { NoopTinybird, Tinybird } from "@chronark/zod-bird"
import { z } from "zod"
import {
  analyticsEventSchema,
  auditLogSchemaV1,
  featureUsageSchemaV1,
  featureVerificationSchemaV1,
  pageEventSchema,
  schemaFeature,
  schemaPlanClick,
  schemaPlanVersion,
  schemaPlanVersionFeature,
} from "./validators"

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
      datasource: "unprice_feature_verifications",
      event: featureVerificationSchemaV1,
      // we need to wait for the ingestion to be done before returning
      wait: true,
    })
  }

  public get ingestFeaturesUsage() {
    return this.writeClient.buildIngestEndpoint({
      datasource: "unprice_feature_usage_records",
      event: featureUsageSchemaV1,
      // we need to wait for the ingestion to be done before returning
      wait: true,
    })
  }

  public get ingestEvents() {
    return this.writeClient.buildIngestEndpoint({
      datasource: "unprice_events",
      event: analyticsEventSchema,
      // we need to wait for the ingestion to be done before returning
      wait: true,
    })
  }

  public get ingestFeatures() {
    return this.writeClient.buildIngestEndpoint({
      datasource: "unprice_features",
      event: schemaFeature,
    })
  }

  public get ingestPlanVersionFeatures() {
    return this.writeClient.buildIngestEndpoint({
      datasource: "unprice_plan_version_features",
      event: schemaPlanVersionFeature,
    })
  }

  public get ingestPageEvents() {
    return this.writeClient.buildIngestEndpoint({
      datasource: "unprice_page_hits",
      event: pageEventSchema,
    })
  }

  public get ingestPlanVersions() {
    return this.writeClient.buildIngestEndpoint({
      datasource: "unprice_plan_versions",
      event: schemaPlanVersion,
    })
  }

  public get getPlanClickBySessionId() {
    return this.readClient.buildPipe({
      pipe: "v1_get_session_event",
      parameters: z.object({
        session_id: z.string(),
        action: z.literal("plan_click"),
        interval_days: z.number().optional(),
      }),
      data: z.object({
        timestamp: z.coerce.date(),
        session_id: z.string(),
        payload: z.string().transform((payload) => schemaPlanClick.parse(JSON.parse(payload))),
      }),
      opts: {
        cache: "no-store",
      },
    })
  }

  public get getPlansConversion() {
    return this.readClient.buildPipe({
      pipe: "v1_get_plans_conversion",
      parameters: z.object({
        intervalDays: z.number().optional(),
        projectId: z.string().optional(),
      }),
      data: z.object({
        date: z.coerce.date(),
        page_id: z.string(),
        plan_version_id: z.string(),
        plan_views: z.number(),
        plan_clicks: z.number(),
        plan_signups: z.number(),
        conversion: z.number(),
      }),
      opts: {
        next: {
          revalidate: 60, // revalidate every minute
        },
      },
    })
  }

  public get getPagesOverview() {
    return this.readClient.buildPipe({
      pipe: "v1_get_pages_overview",
      parameters: z.object({
        intervalDays: z.number().optional(),
        pageId: z.string().optional(),
      }),
      data: z.object({
        date: z.coerce.date(),
        page_id: z.string(),
        desktop_visits: z.number(),
        mobile_visits: z.number(),
        other_visits: z.number(),
        desktop_hits: z.number(),
        mobile_hits: z.number(),
        other_hits: z.number(),
        total_visits: z.number(),
        total_hits: z.number(),
      }),
    })
  }

  public get getFeaturesOverview() {
    return this.readClient.buildPipe({
      pipe: "v1_get_features_overview",
      parameters: z.object({
        intervalDays: z.number().optional(),
        projectId: z.string().optional(),
      }),
      data: z.object({
        date: z.coerce.date(),
        latency: z.number(),
        verifications: z.number(),
        usage: z.number(),
      }),
      opts: {
        next: {
          revalidate: 60, // revalidate every minute
        },
      },
    })
  }

  public get getFeaturesVerifications() {
    return this.readClient.buildPipe({
      pipe: "v1_get_feature_verifications",
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

  public get getFeaturesUsagePeriod() {
    return this.readClient.buildPipe({
      pipe: "v1_get_feature_usage_period",
      parameters: z.object({
        projectId: z.string().optional(),
        customerId: z.string().optional(),
        featureSlug: z.string().optional(),
        entitlementId: z.string().optional(),
        start: z.number(),
        end: z.number(),
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

  public get getFeaturesUsageTotal() {
    return this.readClient.buildPipe({
      pipe: "v1_get_feature_usage_total",
      parameters: z.object({
        projectId: z.string(),
        customerId: z.string(),
        featureSlug: z.string().optional(),
        entitlementId: z.string().optional(),
      }),
      data: z.object({
        projectId: z.string(),
        customerId: z.string(),
        entitlementId: z.string().optional(),
        featureSlug: z.string(),
        count_all: z.number(),
        sum_all: z.number(),
        max_all: z.number(),
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
      pipe: "v1_get_feature_usage_no_duplicates",
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

  public get getFeatureHeatmap() {
    return this.readClient.buildPipe({
      pipe: "v1_get_feature_heatmap",
      parameters: z.object({
        projectId: z.string().optional(),
        start: z.number().optional(),
        end: z.number().optional(),
        intervalDays: z.number().optional(),
      }),
      data: z.object({
        plan_slug: z.string(),
        feature_slug: z.string(),
        project_id: z.string(),
        usage_count: z.number(),
        usage_sum: z.number(),
        verification_count: z.number(),
        activity_score: z.number(),
      }),
      opts: {
        cache: "no-store",
      },
    })
  }
}
