import type { UnpriceOptions } from "./client"

export interface Telemetry {
  /**
   * builderai-Telemetry-Sdk
   * @example @builderai/api@v1.1.1
   */
  sdkVersions: string[]
  /**
   * builderai-Telemetry-Platform
   * @example cloudflare
   */
  platform: string
  /**
   * builderai-Telemetry-Runtime
   * @example node@v18
   */
  runtime?: string
}

export function getTelemetry(opts: UnpriceOptions): Telemetry | null {
  let platform = "unknown"
  let runtime = "unknown"
  // TODO: add version and change this for unprice/api
  const sdkVersions = ["@builderai/unprice@0.0.1"]

  try {
    if (typeof process !== "undefined") {
      if (process.env.builderai_DISABLE_TELEMETRY) {
        return null
      }
      platform = process.env.VERCEL ? "vercel" : process.env.AWS_REGION ? "aws" : "unknown"

      // @ts-expect-error - this is a runtime check
      if (typeof EdgeRuntime !== "undefined") {
        runtime = "edge-light"
      } else {
        runtime = `node@${process.version}`
      }
    }

    if (opts.wrapperSdkVersion) {
      sdkVersions.push(opts.wrapperSdkVersion)
    }
  } catch (_error) {
    return null
  }

  return { platform, runtime, sdkVersions }
}
