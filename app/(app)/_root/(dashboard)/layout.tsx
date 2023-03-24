import { notFound } from "next/navigation"

import { useStore } from "@/lib/stores/layout"
import { createServerClient } from "@/lib/supabase/supabase-server"
import { Footer } from "@/components/shared/layout/footer"
import { Header } from "@/components/shared/layout/header"
import HeaderContext from "@/components/shared/layout/header-context"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* @ts-expect-error Server Component */}
      <Header />
      <HeaderContext />
      {children}
      <Footer />
    </>
  )
}
