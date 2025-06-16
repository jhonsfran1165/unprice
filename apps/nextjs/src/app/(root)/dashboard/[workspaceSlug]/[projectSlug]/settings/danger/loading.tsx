import { Button } from "@unprice/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@unprice/ui/card"
import { Fragment } from "react"

export default function WorkSpaceSettingsDangerLoading() {
  return (
    <Fragment>
      <Card className="border-danger">
        <CardHeader>
          <CardTitle>Transfer to Personal</CardTitle>
          <CardDescription className="flex items-center">
            Transfer this project to your personal workspace
          </CardDescription>
        </CardHeader>
        <CardFooter className="border-t px-6 py-4">
          <Button variant="destructive">Transfer to a personal workspace</Button>
        </CardFooter>
      </Card>
      <Card className="border-danger">
        <CardHeader>
          <CardTitle>Delete project</CardTitle>
          <CardDescription className="flex items-center">
            Transfer this project to a team
          </CardDescription>
        </CardHeader>
        <CardFooter className="border-t px-6 py-4">
          <Button variant="destructive">Delete project</Button>
        </CardFooter>
      </Card>
      <Card className="border-danger">
        <CardHeader>
          <CardTitle>Transfer to Team</CardTitle>
          <CardDescription className="flex items-center">
            Transfer this project to a team workspace
          </CardDescription>
        </CardHeader>
        <CardFooter className="border-t px-6 py-4">
          <Button variant="destructive">Transfer to Team</Button>
        </CardFooter>
      </Card>
    </Fragment>
  )
}
