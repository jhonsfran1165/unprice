"use client"

import { type UserComponent, useNode } from "@craftjs/core"
import ThemeToggle from "~/components/layout/theme-toggle"
import { HeaderSettings } from "./settings"

export const HeaderComponent: UserComponent<{
  links?: { text: string; href: string }[]
  showThemeToggle?: string
}> = (props) => {
  const {
    connectors: { connect },
  } = useNode()

  const { links, showThemeToggle } = props

  return (
    <header
      ref={(ref) => {
        ref && connect(ref)
      }}
      className="top-0 z-40 flex h-16 w-full items-center border-b bg-background-base px-2 shadow-sm backdrop-blur-[2px]"
    >
      <div className="flex h-14 w-full items-center space-x-2 sm:justify-between sm:space-x-0">
        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="flex space-x-4">
            {links?.map((link) => (
              <a
                key={Math.random()}
                href={link.href}
                className="font-medium text-sm text-textPrimary"
              >
                {link.text}
              </a>
            ))}
          </div>
          {showThemeToggle === "yes" && <ThemeToggle />}
        </div>
      </div>
    </header>
  )
}

HeaderComponent.craft = {
  displayName: "My Header",
  props: {
    links: [
      { text: "Home", href: "/" },
      { text: "About", href: "/about" },
      { text: "Contact", href: "/contact" },
    ],
    showThemeToggle: "yes",
  },
  related: {
    toolbar: HeaderSettings,
  },
}
