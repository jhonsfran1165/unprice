import MaxWidthWrapper from "~/components/max-width-wrapper"

export function Header() {
  return (
    <header className="bg-background-bgSubtle sticky top-0 z-50 w-full border-b bg-clip-padding backdrop-blur-xl">
      <MaxWidthWrapper className="max-w-screen-2xl">
        {/* <MainNav />
        <TabsNav /> */}
      </MaxWidthWrapper>
    </header>
  )
}
