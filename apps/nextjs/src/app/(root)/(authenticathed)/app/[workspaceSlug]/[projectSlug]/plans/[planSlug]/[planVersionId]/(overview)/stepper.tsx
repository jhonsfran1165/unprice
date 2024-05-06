import { UserIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@builderai/ui/card"
import { Separator } from "@builderai/ui/separator"

export default function Stepper() {
  return (
    <Card key="1" className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Onboarding Wizard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-row items-center gap-2">
            <UserIcon className="h-5 w-5" />
            <div className="text-xs">Create Account</div>
          </div>
          <Separator className="mx-2 h-6" orientation="vertical" />
          <div className="flex flex-row items-center gap-2">
            <UserIcon className="h-5 w-5" />
            <div className="text-xs">Create Account</div>
          </div>
          <Separator className="mx-2 h-6" orientation="vertical" />
          <div className="flex flex-row items-center gap-2">
            <UserIcon className="h-5 w-5" />
            <div className="text-xs">Create Account</div>
          </div>
          <Separator className="mx-2 h-6" orientation="vertical" />
          <div className="flex flex-row items-center gap-2">
            <UserIcon className="h-5 w-5" />
            <div className="text-xs">Create Account</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
