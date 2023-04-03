import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import HeaderContext from "@/components/layout/header-context"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params
}) {
  return (
    <>
      {/* @ts-expect-error Server Component */}
      <Header />
      <HeaderContext />
      <main className="flex flex-col flex-grow">{children}</main>
      <Footer />
    </>
  )
}
