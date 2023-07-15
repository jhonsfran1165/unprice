import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

import { ProjectForm } from "./project-form"

export function ProjectDialog({
  dialogTrigger,
  open,
  setOpen
}: {
  dialogTrigger: React.ReactNode
  open: boolean
  setOpen: (data: boolean) => void
}) {

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{dialogTrigger}</DialogTrigger>
      <DialogContent className="min-w-[90%] lg:min-w-[40%]">
        <ScrollArea>
          <ProjectForm className="p-6" onSuccess={() => setOpen(false)} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
