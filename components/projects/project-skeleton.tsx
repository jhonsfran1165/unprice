import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const ProjectSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0">
      <div className="space-y-1">
        <CardTitle>
          <Skeleton className="my-3 h-[18px] w-[100px]" />
        </CardTitle>
      </div>
      <div className="flex items-center justify-end">
        <Skeleton className="h-8 w-16" />
      </div>
    </CardHeader>
    <CardContent className="">
      <div className="flex flex-col space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="mt-5 flex space-x-4 text-sm text-muted-foreground">
        <div className="flex items-center">
          <Skeleton className="h-[21px] w-24" />
        </div>
        <div className="flex items-center">
          <Skeleton className="h-[21px] w-10" />
        </div>
      </div>
    </CardContent>
    <CardFooter className="flex items-center justify-end text-xs">
      <div className="flex space-x-4 text-sm text-muted-foreground">
        <div className="flex items-center text-xs font-light">
          <Skeleton className="h-[18px] w-20" />
        </div>
      </div>
    </CardFooter>
  </Card>
)
