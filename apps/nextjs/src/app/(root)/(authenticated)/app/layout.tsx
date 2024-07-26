import type { ReactNode } from "react"

export default async function RootLayout({
  children,
  breadcrumbs,
  sidebar,
  header,
}: {
  children: ReactNode
  breadcrumbs: ReactNode
  sidebar: ReactNode
  header: ReactNode
}) {
  return (
    <div className="flex h-screen flex-col lg:flex-row">
      {sidebar}
      <main className="flex w-full flex-1 flex-col overflow-hidden">
        {header}
        {breadcrumbs}
        <div className="flex-grow overflow-y-auto">{children}</div>
      </main>
    </div>
  )
}
