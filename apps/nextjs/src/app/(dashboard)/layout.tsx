import Footer from "~/components/footer"
import Header from "~/components/header"

export default function DashboardLayout(props: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex grow flex-col">{props.children}</div>
      <Footer />
    </div>
  )
}
