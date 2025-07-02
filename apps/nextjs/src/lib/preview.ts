import { createHmac, timingSafeEqual } from "node:crypto"
import { env } from "~/env"

// expires in 10 minutes
export function generatePreviewToken(pageId: string, expiresInMs = 10 * 60 * 1000) {
  const expires = Date.now() + expiresInMs
  const payload = `${pageId}:${expires}`
  const signature = createHmac("sha256", env.ENCRYPTION_KEY).update(payload).digest("hex")
  return Buffer.from(`${payload}:${signature}`).toString("base64url")
}

export function verifyPreviewToken(token: string, pageId: string) {
  try {
    const decoded = Buffer.from(token, "base64url").toString()
    const [id, expires, signature] = decoded.split(":")
    if (id !== pageId) return false
    if (Number(expires) < Date.now()) return false
    const payload = `${id}:${expires}`
    const expectedSig = createHmac("sha256", env.ENCRYPTION_KEY).update(payload).digest("hex")
    if (!signature) return false
    const sigBuf = Buffer.from(signature)
    const expectedBuf = Buffer.from(expectedSig)
    if (sigBuf.length !== expectedBuf.length) return false
    return timingSafeEqual(new Uint8Array(sigBuf), new Uint8Array(expectedBuf))
  } catch {
    return false
  }
}
