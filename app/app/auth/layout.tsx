import MaxWidthWrapper from "@/components/shared/max-width-wrapper"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main>
      <div className="flex h-36 items-center border-b border-gray-200 bg-white">
        <MaxWidthWrapper>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl text-gray-600">Projects</h1>
          </div>
        </MaxWidthWrapper>
      </div>

      {children}
    </main>
  )
}
