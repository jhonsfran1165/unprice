import { Button } from "@builderai/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"

export default function ProjectSettingsLoading() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Transfer to Organization</CardTitle>
          <CardDescription className="flex items-center">
            Transfer this project to an organization
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-between">
          <Button variant="destructive">Transfer to Organization</Button>
        </CardFooter>
      </Card>

      <Card className="animate-pulse bg-muted">
        <CardHeader>
          <CardTitle>Transfer to Personal</CardTitle>
          <CardDescription>
            Transfer this project to your personal workspace
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-between">
          <Button variant="destructive" className="text-transparent">
            Transfer to Personal
          </Button>
        </CardFooter>
      </Card>

      <Card className="animate-pulse bg-muted">
        <CardHeader>
          <CardTitle>Delete project</CardTitle>
          <CardDescription>
            This will delete the project and all of its data.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-between">
          <Button variant="destructive" className="text-transparent">
            Delete project
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}
