import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

export function OrganizationFormSkeleton() {
  return (
    <Card>
      <div className="flex items-center justify-center p-6 ">
        <Avatar className="h-20 w-20">
          <AvatarFallback>BI</AvatarFallback>
        </Avatar>
        <CardHeader className="w-full">
          <CardTitle className="mb-4 flex text-xl">
            <Skeleton className="h-[30px] w-[200px]" />
          </CardTitle>

          <div className="space-y-1 text-sm text-muted-foreground">
            <Skeleton className="h-[18px] w-full" />
            <Skeleton className="h-[18px] w-full" />
          </div>
        </CardHeader>
      </div>
      <div className="flex items-center justify-center px-6 pb-6">
        <Separator />
      </div>
      <CardContent className="space-y-6">
        <div className="flex flex-col space-y-6 md:flex-row md:space-x-4 md:space-y-0">
          <div className="w-full space-y-3">
            <Skeleton className="h-[15px] w-[100px]" />
            <Skeleton className="h-[40px] w-full" />
          </div>

          <div className="w-full space-y-3">
            <Skeleton className="h-[15px] w-[100px]" />
            <Skeleton className="h-[40px] w-full" />
          </div>
        </div>

        <div className="w-full space-y-3">
          <Skeleton className="h-[15px] w-[100px]" />
          <Skeleton className="h-[40px] w-full" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-[15px] w-[100px]" />
          <div className="flex h-14 w-full animate-pulse items-center justify-center space-x-2 rounded-md border-2 border-dashed"></div>
        </div>

        <div className="space-y-3">
          <Skeleton className="h-[15px] w-[100px]" />
          <Skeleton className="h-[80px] w-full" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-end space-x-2">
          <Skeleton className="h-[40px] w-[112px]" />
        </div>
      </CardFooter>
    </Card>
  )
}
