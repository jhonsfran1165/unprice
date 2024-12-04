import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@unprice/ui/alert"

export function BannerPublishedVersion() {
  return (
    <Alert variant="success">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Version Published</AlertTitle>
      <AlertDescription className="font-extralight">
        This version is published and you can only update its description or deactivate it.
      </AlertDescription>
    </Alert>
  )
}

export function BannerInactiveVersion() {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Version Inactive</AlertTitle>
      <AlertDescription className="font-extralight">
        This version was deactivated and it's not available for new customers. Customers already
        subscribed to this version won't be affected.
      </AlertDescription>
    </Alert>
  )
}
