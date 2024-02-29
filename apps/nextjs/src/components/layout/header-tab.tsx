import MaxWidthWrapper from "~/components/layout/max-width-wrapper"

export default function HeaderTab({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <section>
      <MaxWidthWrapper className="max-w-screen-2xl">
        <div className="flex h-36 items-center rounded-md border px-4 backdrop-blur-sm md:px-10">
          <div className="flex w-full items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-normal text-background-textContrast">
                {title}
              </h1>
              <h4 className="text-base text-muted-foreground">{description}</h4>
            </div>
            <div>{action}</div>
          </div>
        </div>
      </MaxWidthWrapper>
    </section>
  )
}
