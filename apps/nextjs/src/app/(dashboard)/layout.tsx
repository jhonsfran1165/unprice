import Footer from "~/components/footer"
import HeaderContext from "~/components/header-context"
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
