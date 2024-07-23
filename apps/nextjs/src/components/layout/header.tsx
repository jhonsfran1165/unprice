import { MainNav } from "~/components/layout/main-nav"
import { SearchTool } from "./search"
import ThemeToggle from "./theme-toggle"

export default function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b bg-background-base px-2 shadow-sm backdrop-blur-[2px]">
      <div className="flex h-14 w-full items-center space-x-2 sm:justify-between sm:space-x-0">
        <div className="flex items-center justify-start">{children}</div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <MainNav />
          <SearchTool className="hidden lg:block" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
