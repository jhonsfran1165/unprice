export default function HeaderSubTab({
  title,
  action,
  description,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="space-y-2">
        <h1 className="font-cal text-xl font-semibold leading-none">{title}</h1>
        <h2 className="text-base text-muted-foreground">{description}</h2>
      </div>
      {action}
    </div>
  )
}
