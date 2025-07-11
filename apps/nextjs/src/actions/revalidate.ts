"use server"

import { revalidatePath, revalidateTag } from "next/cache"

export async function revalidatePageDomain(domain: string) {
  revalidateTag(`${domain}:page-data`)
}

export async function revalidateAppPath(path: string, type: "layout" | "page") {
  revalidatePath(path, type)
}
