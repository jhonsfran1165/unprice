/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param timeoutMessage Custom timeout error message
 * @returns Promise that resolves with the original promise or rejects on timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage?: string
): Promise<T> {
  const controller = new AbortController()

  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      controller.abort()
      reject(new Error(timeoutMessage || `Request timeout after ${timeoutMs}ms`))
    }, timeoutMs)

    // Clean up timeout if the main promise resolves first
    promise.finally(() => clearTimeout(timeoutId))
  })

  return Promise.race([promise, timeoutPromise])
}

/**
 * Common timeout durations in milliseconds
 */
export const TIMEOUTS = {
  ANALYTICS: 5000, // 5 seconds - for quick operations
  STANDARD: 10000, // 10 seconds - default for most operations
  SLOW: 30000, // 30 seconds - for heavy operations
} as const
