import { base64 } from "./hash"

export class AesGCM {
  public readonly key: CryptoKey
  public static readonly algorithm = "AES-GCM"

  private constructor(key: CryptoKey) {
    this.key = key
  }

  static async withBase64Key(base64Key: string): Promise<AesGCM> {
    const key = await crypto.subtle.importKey(
      "raw",
      base64.decodeBase64(base64Key),
      { name: AesGCM.algorithm, length: 256 },
      false,
      ["encrypt", "decrypt"]
    )
    return new AesGCM(key)
  }

  public async encrypt(secret: string): Promise<{ iv: string; ciphertext: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(32))
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: AesGCM.algorithm,
        iv,
      },
      this.key,
      new TextEncoder().encode(secret)
    )

    // @ts-ignore
    return { iv: base64.encode(iv), ciphertext: base64.encode(ciphertext) }
  }

  public async decrypt(req: { iv: string; ciphertext: string }): Promise<string> {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: AesGCM.algorithm,
        iv: base64.decodeBase64(req.iv),
      },
      this.key,
      base64.decodeBase64(req.ciphertext)
    )

    return new TextDecoder().decode(decryptedBuffer)
  }
}
