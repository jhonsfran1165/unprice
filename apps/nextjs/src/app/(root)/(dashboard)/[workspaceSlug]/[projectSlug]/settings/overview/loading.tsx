import { Button } from "@builderai/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"
import { Label } from "@builderai/ui/label"
import { Skeleton } from "@builderai/ui/skeleton"

export const runtime = "edge"

export default function ProjectSettingsLoading() {
  return (
    <Card className="animate-pulse bg-muted">
      <CardHeader>
        <CardTitle>Project name</CardTitle>
        <CardDescription>
          Change the display name of your project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label>Name</Label>
        <Skeleton className="h-[38px] w-full" />
      </CardContent>
      <CardFooter>
        <Button className="ml-auto text-transparent">Save</Button>
      </CardFooter>
    </Card>
  )
}
