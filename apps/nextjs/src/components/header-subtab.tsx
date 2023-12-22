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
    <div className="mb-6 flex items-center justify-between">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold leading-none">{title}</h1>
        <h4 className="text-base text-muted-foreground">{description}</h4>
      </div>
      {action}
    </div>
  )
}
