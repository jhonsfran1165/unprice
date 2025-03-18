import type {
  ReportUsageRequest,
  ReportUsageResponse,
  RevalidateRequest,
  UsageLimiter,
} from "./interface"

export class NoopUsageLimiter implements UsageLimiter {
  public async reportUsage(_req: ReportUsageRequest): Promise<ReportUsageResponse> {
    return { valid: true, remaining: -1 }
  }

  public async revalidate(_req: RevalidateRequest): Promise<void> {}
}
