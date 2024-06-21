import type { ReactNode } from "react"
import { UpdateClientCookie } from "./_components/update-client-cookie"

export const runtime = "edge"

export default async function TestPage({
  children,
  breadcrumbs,
  navigation,
  header,
}: {
  children: ReactNode
  breadcrumbs: ReactNode
  sidebar: ReactNode
  navigation: ReactNode
  header: ReactNode
}) {
  return (
    <div className="min-h-screen w-full">
      <UpdateClientCookie />
      {navigation}
      <main className="lg:pl-64 xl:pl-72">
        {header}
        <div className="px-2 md:px-6 py-2 md:py-4">{breadcrumbs}</div>

        <div className="lg:px-6 lg:py-4">{children}</div>
      </main>
    </div>
  )
}
