import type { ModulesAppNav } from "@builderai/config"
import { getModulesApp } from "@builderai/config"

import Footer from "~/components/footer"
import HeaderContext from "~/components/header-context"
import { LegendStateHandler } from "~/components/state-handler"
import Header from "./_components/header"

export default function DashboardLayout(props: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const modules = getModulesApp() as ModulesAppNav

  return (
    <div className="flex min-h-screen flex-col">
      <LegendStateHandler modulesApp={modules} />
      <Header />
      <HeaderContext />
      <main className="my-10 flex grow flex-col">{props.children}</main>
      <Footer />
    </div>
  )
}
