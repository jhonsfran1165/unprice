import type {
  FeatureDenyReason,
  FeatureReportUsageError,
} from "@builderai/db/validators"

export class UnPriceVerificationError extends Error {
  public readonly code: FeatureDenyReason
  public readonly currentUsage?: number
  public readonly limit?: number

  constructor({
    code,
    message,
    currentUsage,
    limit,
  }: {
    code: FeatureDenyReason
    message: string
    currentUsage?: number
    limit?: number
  }) {
    super(message)
    this.code = code
    this.currentUsage = currentUsage
    this.limit = limit
  }
}

export class UnPriceReportUsageError extends Error {
  public readonly code: FeatureReportUsageError

  constructor({
    code,
    message,
  }: {
    code: FeatureReportUsageError
    message: string
  }) {
    super(message)
    this.code = code
  }
}
