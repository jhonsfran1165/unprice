import Footer from "~/components/footer"

export default function DashboardLayout(props: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex grow flex-col">{props.children}</div>
      <Footer />
    </div>
  )
}
