export function getImageSrc(logo: File | string | null, mimeType?: string): string | undefined {
  if (!logo) return undefined
  if (logo instanceof File) return URL.createObjectURL(logo)
  if (typeof logo === "string" && logo.startsWith("http")) return logo // If it's a URL

  // Use the provided mimeType, fallback to image/webp
  const type = mimeType || "image/webp"
  return `data:${type};base64,${logo}`
}

export function isSvgLogo(mimeType?: string): boolean {
  return mimeType === "image/svg+xml"
}
