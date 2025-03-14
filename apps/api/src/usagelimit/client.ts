import type { DurableObjectUsagelimiter } from './do'
import {
  type LimitRequest,
  type LimitResponse,
  type RevalidateRequest,
  type UsageLimiter,
  limitResponseSchema
} from './interface'

export class DurableUsageLimiter implements UsageLimiter {
  private readonly namespace: DurableObjectNamespace<DurableObjectUsagelimiter>
  private readonly domain: string
  private readonly requestId: string
  constructor(opts: {
    namespace: DurableObjectNamespace<DurableObjectUsagelimiter>
    requestId: string
    domain?: string
  }) {
    this.requestId = opts.requestId
    this.namespace = opts.namespace
    this.domain = opts.domain ?? 'unkey.dev'
  }

  private getStub(name: string, locationHint?: DurableObjectLocationHint): DurableObjectStub<DurableObjectUsagelimiter> {
    return this.namespace.get(this.namespace.idFromName(name), {
      locationHint,
    })
  }

  public async reportUsage(req: LimitRequest): Promise<LimitResponse> {
    const start = performance.now()

    try {
      const stub = this.getStub(req.customerId)
      const reportLimit = await stub.reportUsage(req)
      // parse the result
      const parsed = limitResponseSchema.parse(reportLimit)

      return parsed
    } catch (e) {
      console.error('usagelimit failed', { customerId: req.customerId, error: (e as Error).message })
      return { valid: false }
    } finally {
      console.log({
        latency: performance.now() - start,
        customerId: req.customerId,
      })
    }
  }

  public async revalidate(req: RevalidateRequest): Promise<void> {
    const obj = this.namespace.get(this.namespace.idFromName(req.keyId))
    await obj.revalidate(req)
  }
}
