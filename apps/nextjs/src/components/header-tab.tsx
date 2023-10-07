import MaxWidthWrapper from "~/components/max-width-wrapper"

export default function HeaderTab({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <section>
      <div className="z-30 flex h-36 items-center border-b bg-background bg-clip-padding text-background-textContrast">
        <MaxWidthWrapper className="max-w-screen-2xl">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-normal">{title}</h1>
            {action}
          </div>
        </MaxWidthWrapper>
      </div>
    </section>
  )
}
