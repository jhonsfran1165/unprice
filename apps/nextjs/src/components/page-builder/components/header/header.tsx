"use client"

import { Logo } from "@builderai/ui/icons"
import { type UserComponent, useNode } from "@craftjs/core"
import ThemeToggle from "~/components/layout/theme-toggle"
import { HeaderSettings } from "./settings"
import type { HeaderComponentProps } from "./types"

export const HeaderComponent: UserComponent<HeaderComponentProps> = (props) => {
  const {
    connectors: { connect },
  } = useNode()

  const { links, showThemeToggle, showLinks } = props

  return (
    <header
      ref={(ref) => {
        ref && connect(ref)
      }}
      className="top-0 z-30 flex h-16 w-full items-center border-b bg-background-base px-2 shadow-sm backdrop-blur-[2px]"
    >
      <div className="flex items-center gap-4 text-primary-text md:flex-row md:gap-2 md:px-0">
        <Logo />
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

HeaderComponent.craft = {
  displayName: "Header",
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
    toolbar: HeaderSettings,
  },
}
