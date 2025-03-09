import { cn } from "@unprice/ui/utils"
import type { BundledLanguage, BundledTheme } from "shiki"
import { codeToHtml } from "shiki"
import CopyToClipboard from "./copy-to-clipboard"

type Props = {
  code: string
  lang?: BundledLanguage
  theme?: BundledTheme
  filename?: string
  copy?: boolean
  className?: string
}

export default async function Code({
  code,
  lang = "typescript",
  copy = true,
  // tokyo-night
  // catppuccin-macchiato
  // min-dark
  // poimandres
  theme = "min-dark",
  className,
}: Props) {
  const html = await codeToHtml(code, {
    lang,
    theme,
  })

  return (
    <div
      className={cn(
        "relative w-full overflow-auto rounded-xl bg-background shadow-lg shadow-primary-line ring-1 ring-primary-line",
        className
      )}
    >
      {copy && (
        <div className="absolute top-3 right-3">
          <CopyToClipboard code={code} />
        </div>
      )}

      <div
        className="[&>pre]:!bg-background [&>pre]:dark:!bg-background text-sm [&>pre]:overflow-x-auto [&>pre]:py-6 [&>pre]:pr-5 [&>pre]:pl-4 [&>pre]:leading-snug [&_code]:block [&_code]:w-fit [&_code]:min-w-full"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
