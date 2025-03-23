import type { CanRequest, ReportUsageRequest, ReportUsageResponse, UsageLimiter } from "./interface"

export class NoopUsageLimiter implements UsageLimiter {
  public async reportUsage(_req: ReportUsageRequest): Promise<ReportUsageResponse> {
    return { success: true }
  }

  public async deleteCustomer(_customerId: string): Promise<{
    success: boolean
    message: string
  }> {
    return { success: true, message: "noop" }
  }

  public async revalidateEntitlement(
    _customerId: string,
    _featureSlug: string
  ): Promise<{
    success: boolean
    message: string
  }> {
    return { success: true, message: "noop" }
  }

  public async can(_req: CanRequest): Promise<{
    success: boolean
    message: string
  }> {
    return { success: true, message: "noop" }
  }
}
