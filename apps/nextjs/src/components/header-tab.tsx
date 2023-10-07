import MaxWidthWrapper from "~/components/max-width-wrapper"

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
      <MaxWidthWrapper className="max-w-screen-2xl py-10">
        <div className="flex h-36 items-center rounded-md border px-10">
          <div className="flex w-full items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-normal text-background-textContrast">
                {title}
              </h1>
              <h3 className="text-base text-muted-foreground">{description}</h3>
            </div>

            {action}
          </div>
        </div>
      </MaxWidthWrapper>
    </section>
  )
}
