"use client"

import { type UserComponent, useNode } from "@craftjs/core"
import { Logo } from "~/components/layout/logo"
import ThemeToggle from "~/components/layout/theme-toggle"
import { FooterSettings } from "./settings"
import type { FooterComponentProps } from "./types"

export const FooterComponent: UserComponent<FooterComponentProps> = (props) => {
  const {
    connectors: { connect },
  } = useNode()

  const { links, showThemeToggle, showLinks } = props

  return (
    <footer
      ref={(ref) => {
        ref && connect(ref)
      }}
      className={
        "bottom-0 z-30 mx-auto flex w-full items-center justify-between gap-4 border-t bg-background-bgSubtle px-6 md:h-16 md:flex-row md:py-0"
      }
    >
      <div className="flex items-center gap-4 text-primary-text md:flex-row md:gap-2 md:px-0">
        <Logo className={"size-6 text-primary-text"} />
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

FooterComponent.craft = {
  displayName: "Footer",
  props: {
    links: [
      { title: "Home", href: "/" },
      { title: "About", href: "/about" },
      { title: "Contact", href: "/contact" },
    ],
    showThemeToggle: true,
    showLinks: true,
  },
  related: {
    toolbar: FooterSettings,
  },
}
