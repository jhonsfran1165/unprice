import DotPattern from "~/components/dot-pattern"
import Footer from "~/components/footer"
import Header from "~/components/header"

export default function DashboardLayout(props: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <DotPattern width={40} height={40} x={-1} y={-1} />
      <Header />
      <div className="flex grow flex-col">{props.children}</div>
      <Footer />
    </div>
  )
}
