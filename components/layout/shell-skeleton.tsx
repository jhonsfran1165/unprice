import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ShellSkeleton() {
  return (
    <Card>
      <CardHeader className="w-full">
        <CardTitle className="mb-4 flex text-xl">
          <Skeleton className="h-[30px] w-[200px]" />
        </CardTitle>
        <div className="space-y-1 text-sm text-muted-foreground">
          <Skeleton className="h-[18px] w-full" />
          <Skeleton className="h-[18px] w-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Skeleton className="h-[73px] w-full" />
      </CardContent>
    </Card>
  )
}
