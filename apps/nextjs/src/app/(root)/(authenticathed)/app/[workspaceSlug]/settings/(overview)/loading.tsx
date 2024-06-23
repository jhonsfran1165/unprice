import { Button } from "@builderai/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@builderai/ui/card"
import { Fragment } from "react"

export default function WorkSpaceSettingsDangerLoading() {
  return (
    <Fragment>
      <Card className="bg-muted animate-pulse">
        <CardHeader>
          <CardTitle>Workspace Name</CardTitle>
          <CardDescription>Change the name of your workspace</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-between">
          <Button variant="destructive" className="text-transparent">
            Delete
          </Button>
        </CardFooter>
      </Card>
      <Card className="bg-muted animate-pulse">
        <CardHeader>
          <CardTitle>Delete</CardTitle>
          <CardDescription>This will delete the workspace and all of its data.</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-between">
          <Button variant="destructive" className="text-transparent">
            Delete
          </Button>
        </CardFooter>
      </Card>
    </Fragment>
  )
}
