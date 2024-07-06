import { Logo } from "~/components/layout/logo"
import { Toolbar } from "../toolbar"

export function ConfiguratorSidebar() {
  const elements = [
    {
      name: "Text",
    },
  ]
  return (
    <nav className="right-0 z-40 h-full max-h-screen gap-2 inset-y-0 flex w-64 flex-col xl:w-72">
      <aside className="flex grow flex-col gap-y-6 overflow-y-auto border-l p-4">
        <Logo />
        <nav aria-label="core navigation links" className="flex flex-1 flex-col space-y-10">
          <Toolbar />
        </nav>
      </aside>
    </nav>
  )
}
