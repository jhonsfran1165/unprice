import BackGround from "@/components/shared/background"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import { SiteHeader } from "@/components/site-header"

interface LayoutProps {
  children: React.ReactNode
}

export async function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col justify-between">
      {/* activate or deactivate the background */}
      <div className={`${false ? "bg-gray-50" : ""} z-20`}>
        {/* @ts-expect-error Server Component */}
        <SiteHeader />
        <MaxWidthWrapper>
          <main>{children}</main>
        </MaxWidthWrapper>
      </div>

      <BackGround />
    </div>
  )
}
