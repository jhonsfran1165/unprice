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
        <div className="px-4 md:px-6">{breadcrumbs}</div>
        <div className="py-4">{children}</div>
      </main>
    </div>
  )
}
