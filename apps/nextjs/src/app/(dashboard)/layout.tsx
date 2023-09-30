import Footer from "~/components/layout/footer"
import HeaderContext from "~/components/layout/header-context"
import Header from "./_components/header"

export default function DashboardLayout(props: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <HeaderContext />
      <main className="my-10 flex grow flex-col">{props.children}</main>
      <Footer />
    </div>
  )
}
