import { Logo } from "@builderai/ui/icons"
import ThemeToggle from "~/components/layout/theme-toggle"
import type { FooterComponentProps } from "./types"

export const FooterPreview = (props: FooterComponentProps) => {
  const { links, showThemeToggle, showLinks } = props

  return (
    <footer
      className={
        "bottom-0 z-30 mx-auto flex w-full items-center justify-between gap-4 border-t bg-background-bgSubtle px-6 md:h-16 md:flex-row md:py-0"
      }
    >
      <div className="flex items-center gap-4 text-primary-text md:flex-row md:gap-2 md:px-0">
        <Logo />
      </div>

      <div className="flex flex-1 items-center justify-end">
        <nav className="flex items-center">
          {/* // TODO: add command for the most important actions in the platform - dev exp focused */}
          {showLinks &&
            links?.map((link) => (
              <a
                key={Math.random()}
                href={link.href}
                className="font-medium text-sm text-textPrimary"
              >
                {link.title}
              </a>
            ))}

          {showThemeToggle && <ThemeToggle />}
        </nav>
      </div>
    </footer>
  )
}
