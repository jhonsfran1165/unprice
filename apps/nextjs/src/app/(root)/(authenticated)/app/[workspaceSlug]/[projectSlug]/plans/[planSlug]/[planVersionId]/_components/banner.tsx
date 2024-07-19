import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@unprice/ui/alert"

export function BannerPublishedVersion() {
  return (
    <Alert variant="info">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Version Published</AlertTitle>
      <AlertDescription>This version is published and cannot be edited.</AlertDescription>
    </Alert>
  )
}
