import BackGround from "@/components/shared/background"
import { SiteHeader } from "@/components/site-header"

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col justify-between">
      {/* activate or deactivate the background */}
      <div className={`${false ? "bg-gray-50" : ""} z-20`}>
        {/* @ts-expect-error Server Component */}
        <SiteHeader />
        {children}
      </div>

      <BackGround />
    </div>
  )
}
