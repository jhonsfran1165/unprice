import { Button } from "@builderai/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"
import { Skeleton } from "@builderai/ui/skeleton"

// TODO: activate later. It is  hitting limits on vercel
// export const runtime = "edge"

export default function WorkSpaceSettingsDangerLoading() {
  return (
    <>
      <Card className="animate-pulse bg-muted">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            You are currently on the{" "}
            {<Skeleton className="inline h-[15px] w-[30px]"></Skeleton>} plan.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button className="text-transparent">Manage Subscription</Button>
        </CardFooter>
      </Card>
      <Card className="mt-4 animate-pulse bg-muted">
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent>TODO</CardContent>
      </Card>
    </>
  )
}
