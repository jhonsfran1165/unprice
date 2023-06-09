import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProjectForm } from "./project-form"

export function AddProjectDialog({ cta }: { cta: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="primary contents border-none px-2">{cta}</Button>
      </DialogTrigger>
      <DialogContent className="min-w-[90%] lg:min-w-[40%]">
        <ScrollArea>
          <ProjectForm orgSlug="1234" className="p-6" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
