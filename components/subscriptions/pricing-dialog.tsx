import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import Pricing from "@/components/subscriptions/pricing"

export function PricingDialog({ cta }: { cta: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="contents primary border-none px-2">{cta}</Button>
      </DialogTrigger>
      <DialogContent className="min-w-[80%] h-5/6">
        <ScrollArea>
          <Pricing type="private" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
