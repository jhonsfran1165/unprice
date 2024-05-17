import { NoopTinybird, Tinybird } from "@chronark/zod-bird"
import { z } from "zod"

import { auditLogSchemaV1, featureVerificationSchemaV1 } from "./validators"

export class Analytics {
  public readonly readClient: Tinybird | NoopTinybird
  public readonly writeClient: Tinybird | NoopTinybird

  constructor(opts: {
    tinybirdToken?: string
    tinybirdProxy?: {
      url: string
      token: string
    }
  }) {
    this.readClient = opts.tinybirdToken
      ? new Tinybird({ token: opts.tinybirdToken })
      : new NoopTinybird()

    this.writeClient = opts.tinybirdProxy
      ? new Tinybird({
          token: opts.tinybirdProxy.token,
          baseUrl: opts.tinybirdProxy.url,
        })
      : this.readClient
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

  // TODO: support audit logs

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
      datasource: "features_verifications__v1",
      event: featureVerificationSchemaV1,
    })
  }
}
