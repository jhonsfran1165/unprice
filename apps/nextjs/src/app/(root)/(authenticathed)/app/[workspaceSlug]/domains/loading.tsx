import { Card, CardContent, CardFooter, CardHeader } from "@builderai/ui/card"
import { Skeleton } from "@builderai/ui/skeleton"

export const runtime = "edge"

export default function DomainPageLoading() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-row items-center ">
            <Skeleton className="h-6 w-[150px]" />

            <Skeleton className="ml-2 h-6 w-6" />

            <Skeleton className="ml-2 w-[200px] rounded-md" />
          </div>

          <div className="flex flex-row items-center justify-between space-x-2">
            <Skeleton className="h-6 w-[50px]" />

            <Skeleton className="h-6 w-[50px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-background-bg p-4"></div>
      </CardContent>
      <CardFooter>dasdasdsad</CardFooter>
    </Card>
  )
}
