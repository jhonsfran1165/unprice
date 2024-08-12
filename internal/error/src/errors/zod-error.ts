import type { z } from "zod"

// TODO: use https://www.npmjs.com/package/zod-validation-error

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
