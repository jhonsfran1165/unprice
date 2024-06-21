import { MainNav } from "~/components/layout/main-nav"
import ThemeToggle from "./theme-toggle"

export default function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="bg-background-base sticky top-0 z-40 flex items-center px-2 backdrop-blur-[2px] border-b shadow-sm">
      <div className="flex w-full h-14 items-center space-x-2 sm:justify-between sm:space-x-0">
        <div className="flex items-center justify-start">{children}</div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <MainNav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
