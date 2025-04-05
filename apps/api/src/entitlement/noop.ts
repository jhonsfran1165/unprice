import type {
  CanRequest,
  CanResponse,
  EntitlementLimiter,
  GetEntitlementsRequest,
  GetEntitlementsResponse,
  ReportUsageRequest,
  ReportUsageResponse,
} from "./interface"

export class NoopEntitlementLimiter implements EntitlementLimiter {
  public async reportUsage(_req: ReportUsageRequest): Promise<ReportUsageResponse> {
    return { success: true }
  }

  public async resetEntitlements(
    _customerId: string,
    _projectId: string
  ): Promise<{
    success: boolean
    message: string
  }> {
    return { success: true, message: "noop" }
  }

  public async getEntitlements(_req: GetEntitlementsRequest): Promise<GetEntitlementsResponse> {
    return {
      entitlements: [],
    }
  }

  public async can(_req: CanRequest): Promise<CanResponse> {
    return { success: true, message: "noop" }
  }
}
