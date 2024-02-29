import { version } from "../package.json"
import type { BuilderaiOptions } from "./client"

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
  platform?: string
  /**
   * builderai-Telemetry-Runtime
   * @example node@v18
   */
  runtime?: string
}

export function getTelemetry(opts: BuilderaiOptions): Telemetry | null {
  let platform: string | undefined
  let runtime: string | undefined
  const sdkVersions = [`@builderai/api@${version}`]

  try {
    if (typeof process !== "undefined") {
      if (process.env.builderai_DISABLE_TELEMETRY) {
        return null
      }
      platform = process.env.VERCEL
        ? "vercel"
        : process.env.AWS_REGION
          ? "aws"
          : undefined

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
