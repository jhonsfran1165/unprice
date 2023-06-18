import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import Pricing from "@/components/subscriptions/pricing"

export function PricingDialog({ cta }: { cta: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="primary contents border-none px-2">{cta}</Button>
      </DialogTrigger>
      <DialogContent className="h-5/6 min-w-[95%] lg:min-w-[90%]">
        <ScrollArea>
          <Pricing type="private" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
