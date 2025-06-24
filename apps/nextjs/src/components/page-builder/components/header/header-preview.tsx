import { Logo } from "~/components/layout/logo"
import ThemeToggle from "~/components/layout/theme-toggle"
import type { HeaderComponentProps } from "./types"

export const HeaderPreview = (props: HeaderComponentProps) => {
  const { links, showThemeToggle, showLinks } = props

  return (
    <header className="top-0 z-40 flex h-16 w-full items-center border-b bg-background-base px-2 shadow-sm backdrop-blur-[2px]">
      <div className="flex items-center gap-4 text-primary-text md:flex-row md:gap-2 md:px-0">
        <Logo className={"size-6 text-primary-text"} />
      </div>

      <div className="flex h-14 w-full items-center space-x-2 sm:justify-between sm:space-x-0">
        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="flex space-x-4 px-4">
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
          </div>
          {showThemeToggle && <ThemeToggle />}
        </div>
      </div>
    </header>
  )
}
