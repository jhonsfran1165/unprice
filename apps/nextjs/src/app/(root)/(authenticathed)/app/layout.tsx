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
    <div className="min-h-screen w-full">
      {sidebar}
      <main className="lg:pl-64 xl:pl-72">
        {header}
        <div className="px-2 md:px-6 py-2 md:py-4">{breadcrumbs}</div>
        <div className="lg:px-6 py-4">{children}</div>
      </main>
    </div>
  )
}
