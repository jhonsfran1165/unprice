import BackGround from "@/components/shared/background"
import { SiteHeader } from "@/components/site-header"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col justify-between">
      {/* activate or deactivate the background */}
      <div className={`${false ? "bg-gray-50" : ""} z-20`}>
        <SiteHeader />

        <div className="mx-auto max-w-screen-xl px-5 md:px-20">
          <main>{children}</main>
        </div>
      </div>

      <BackGround />
    </div>
  )
}
