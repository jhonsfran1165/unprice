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
    <div className="flex min-h-screen flex-col lg:flex-row">
      {sidebar}
      <main className="flex w-full flex-1 flex-col">
        {header}
        <div className="px-4 md:px-6">{breadcrumbs}</div>
        <div className="flex-grow">{children}</div>
      </main>
    </div>
  )
}
