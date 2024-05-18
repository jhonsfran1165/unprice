import type {
  FeatureDenyReason,
  FeatureReportUsageError,
} from "@builderai/db/validators"

export class UnPriceVerificationError extends Error {
  public readonly code: FeatureDenyReason

  constructor({ code, message }: { code: FeatureDenyReason; message: string }) {
    super(message)
    this.code = code
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
