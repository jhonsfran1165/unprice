"use server"

import { revalidateTag } from "next/cache"

export async function revalidatePageDomain(domain: string) {
  revalidateTag(domain)
}
