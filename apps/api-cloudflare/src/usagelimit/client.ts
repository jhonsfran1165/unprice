import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import type { Cache } from "~/cache"
import type { Metrics } from "~/metrics/interface"
import type { DurableObjectUsagelimiter } from "./do"
import {
  type LimitRequest,
  type LimitResponse,
  type RevalidateRequest,
  type UsageLimiter,
  limitResponseSchema,
} from "./interface"

export class DurableUsageLimiter implements UsageLimiter {
  private readonly namespace: DurableObjectNamespace<DurableObjectUsagelimiter>
  private readonly domain: string
  private readonly requestId: string
  private readonly logger: Logger
  private readonly metrics: Metrics
  private readonly analytics: Analytics
  private readonly cache: Cache

  constructor(opts: {
    namespace: DurableObjectNamespace<DurableObjectUsagelimiter>
    requestId: string
    domain?: string
    logger: Logger
    metrics: Metrics
    analytics: Analytics
    cache: Cache
  }) {
    this.requestId = opts.requestId
    this.namespace = opts.namespace
    this.domain = opts.domain ?? "unkey.dev"
    this.logger = opts.logger
    this.metrics = opts.metrics
    this.analytics = opts.analytics
    this.cache = opts.cache
  }

  private getStub(
    name: string,
    locationHint?: DurableObjectLocationHint
  ): DurableObjectStub<DurableObjectUsagelimiter> {
    return this.namespace.get(this.namespace.idFromName(name), {
      locationHint,
    })
  }

  public async reportUsage(req: LimitRequest): Promise<LimitResponse> {
    const _start = performance.now()

    try {
      const stub = this.getStub(req.customerId)
      const reportLimit = await stub.reportUsage(req)
      // parse the result
      const parsed = limitResponseSchema.parse(reportLimit)

      return parsed
    } catch (e) {
      console.error("usagelimit failed", {
        customerId: req.customerId,
        error: (e as Error).message,
      })
      return { valid: false }
    } finally {
    }
  }

  public async revalidate(req: RevalidateRequest): Promise<void> {
    const obj = this.namespace.get(this.namespace.idFromName(req.keyId))
    await obj.revalidate()
  }
}
