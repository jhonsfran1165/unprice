import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@builderai/ui/alert"

export function BannerPublishedVersion() {
  return (
    <div className="flex w-full flex-col justify-center">
      <div className="mx-auto flex w-1/2 flex-col">
        <Alert variant="default">
          <AlertCircle className="h-4 w-4 text-info" />
          <AlertTitle>Version Published</AlertTitle>
          <AlertDescription>
            This plan version is published and cannot be edited.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
