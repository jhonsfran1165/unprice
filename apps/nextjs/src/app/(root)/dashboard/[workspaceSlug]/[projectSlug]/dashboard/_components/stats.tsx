import { Card, CardContent, CardHeader, CardTitle } from "@unprice/ui/card"

type StatsProps = {
  total: string
  icon: React.ReactNode
  title: string
  description: string
}

const Stats = ({ stats }: { stats: StatsProps[] }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stat.total}</div>
            <p className="text-muted-foreground text-xs">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default Stats
