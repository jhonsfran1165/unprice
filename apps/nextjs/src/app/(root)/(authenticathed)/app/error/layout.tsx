import Header from "~/components/layout/header"
import { UpdateClientCookie } from "../_components/update-client-cookie"

export const runtime = "edge"

export default function DashboardLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <UpdateClientCookie />
      <Header />
      <div>{props.children}</div>
    </div>
  )
}
