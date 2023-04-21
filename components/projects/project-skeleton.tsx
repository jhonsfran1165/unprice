import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Icons } from "@/components/shared/icons"

export const ProjectSkeleton = ({ isLoading }: { isLoading?: boolean }) => (
  <Card>
    <CardHeader className="grid grid-cols-[1fr_110px] items-start gap-4 space-y-0">
      <div className="space-y-1">
        <CardTitle>
          <Skeleton className="h-4 w-[150px]" />
          <br />
        </CardTitle>
        <CardDescription className="space-y-2">
          <Skeleton className="h-2 w-[100px]" />
          <Skeleton className="h-2 w-20" />
          <Skeleton className="h-2 w-20" />
        </CardDescription>
      </div>
      <div className="flex items-center justify-end space-x-1">
        <Skeleton className="h-[40px] w-[100px]" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex space-x-4 text-sm text-muted-foreground">
        <div className="flex items-center">
          <Skeleton className="h-2 w-20" />
        </div>
        <div className="flex items-center">
          <Skeleton className="h-2 w-20" />
        </div>
      </div>
    </CardContent>
    <CardFooter className="flex justify-end text-xs">
      <Skeleton className="h-2 w-20" />
    </CardFooter>
  </Card>
)
