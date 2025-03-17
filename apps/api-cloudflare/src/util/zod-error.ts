import type { z } from "zod"

export function parseZodErrorMessage(err: z.ZodError): string {
  try {
    const arr = JSON.parse(err.message) as Array<{
      message: string
      path: Array<string>
    }>
    const { path, message } = arr[0] ?? { path: [], message: err.message }
    return `${path.join(".")}: ${message}`
  } catch {
    return err.message
  }
}
