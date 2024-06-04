import type { z } from "zod"

export function parseZodErrorMessage(err: z.ZodError): string {
  try {
    const arr = JSON.parse(err.message) as Array<{
      message: string
      path: Array<string>
    }>
    const data = arr[0]
    return `${data?.path.join(".")}: ${data?.message}`
  } catch {
    return err.message
  }
}
