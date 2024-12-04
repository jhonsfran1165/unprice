"use server"

import { revalidatePath, revalidateTag } from "next/cache"

export async function revalidatePageDomain(domain: string) {
  revalidateTag(domain)
}

export async function revalidateAppPath(path: string, type: "layout" | "page") {
  revalidatePath(path, type)
}
