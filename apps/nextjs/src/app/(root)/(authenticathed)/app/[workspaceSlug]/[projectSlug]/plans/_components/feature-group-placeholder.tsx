import { Button } from "@builderai/ui/button"
import { FileStack } from "@builderai/ui/icons"

export function FeatureGroupEmptyPlaceholder() {
  return (
    <div className="relative flex h-full w-full items-center justify-center rounded-md border border-dashed">
      <div className="mx-auto flex flex-col items-center justify-center text-center">
        <FileStack className="h-8 w-8" />

        <h3 className="mt-4 text-lg font-semibold">No features added</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          You have not added any feature. Add one below.
        </p>
        <Button size="sm" className="relative">
          Add Feature
        </Button>
      </div>
    </div>
  )
}
