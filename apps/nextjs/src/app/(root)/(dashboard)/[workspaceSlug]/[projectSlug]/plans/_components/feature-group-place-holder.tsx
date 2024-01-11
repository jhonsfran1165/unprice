import { Button } from "@builderai/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"
import { FileStack } from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"
import { Label } from "@builderai/ui/label"

export function FeatureGroupEmptyPlaceholder() {
  return (
    <div className="flex h-[500px] w-full items-center justify-center rounded-md border border-dashed">
      <div className="mx-auto flex flex-col items-center justify-center text-center">
        <FileStack className="h-8 w-8" />

        <h3 className="mt-4 text-lg font-semibold">No features added</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          You have not added any feature. Add one below.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="relative">
              Add Feature
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Feature</DialogTitle>
              <DialogDescription>
                Copy and paste the podcast feed URL to import.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="url">Podcast URL</Label>
                <Input id="url" placeholder="https://example.com/feed.xml" />
              </div>
            </div>
            <DialogFooter>
              <Button>Import Podcast</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
