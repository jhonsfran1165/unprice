import { Footer } from "@/components/shared/layout/footer"
import { Header } from "@/components/shared/layout/header"
import HeaderContext from "@/components/shared/layout/header-context"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen">
      {/* @ts-expect-error Server Component */}
      <Header />
      <HeaderContext />
      {children}
      <Footer />
    </div>
  )
}
