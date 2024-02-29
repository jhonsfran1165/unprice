import baseX from "base-x"

import { customAlphabet, dbNameSpaces } from "./constants"

function encodeBase58(buf: Buffer): string {
  return baseX(customAlphabet).encode(buf)
}
/**
 * Generate ids similar to stripe
 */
class IdGenerator<TPrefixes extends string> {
  private prefixes: Record<TPrefixes, string>

  /**
   * Create a new id generator with fully typed prefixes
   * @param prefixes - Relevant prefixes for your domain
   */
  constructor(prefixes: Record<TPrefixes, string>) {
    this.prefixes = prefixes
  }

  /**
   * Generate a new unique base58 encoded uuid with a defined prefix
   *
   * @returns xxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   */
  public id = (prefix: TPrefixes): string => {
    return [
      this.prefixes[prefix],
      encodeBase58(Buffer.from(crypto.randomUUID().replace(/-/g, ""), "hex")),
    ].join("_")
  }
}

export const newIdEdge = new IdGenerator(dbNameSpaces).id
