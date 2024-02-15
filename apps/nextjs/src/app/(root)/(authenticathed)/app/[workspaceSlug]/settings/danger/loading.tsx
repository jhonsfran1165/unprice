import { Button } from "@builderai/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"

export const runtime = "edge"

export default function WorkSpaceSettingsDangerLoading() {
  return (
    <Card className="animate-pulse bg-muted">
      <CardHeader>
        <CardTitle>Delete workspace</CardTitle>
        <CardDescription>
          This will delete the workspace and all of its data.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between">
        <Button variant="destructive" className="text-transparent">
          Delete workspace
        </Button>
      </CardFooter>
    </Card>
  )
}
