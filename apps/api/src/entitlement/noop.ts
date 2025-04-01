import { type FetchError, Ok, type Result } from "@unprice/error"
import type { UnPriceCustomerError } from "@unprice/services/customers"
import type {
  CanRequest,
  EntitlementLimiter,
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

  public async revalidateEntitlement(
    _customerId: string,
    _featureSlug: string,
    _projectId: string,
    _now: number
  ): Promise<Result<void, FetchError | UnPriceCustomerError>> {
    return Ok(undefined)
  }

  public async can(_req: CanRequest): Promise<{
    success: boolean
    message: string
  }> {
    return { success: true, message: "noop" }
  }
}
