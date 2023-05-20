import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

import Pricing from "./pricing"

export function PricingDialog({ cta }: { cta: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="contents primary border-none px-2">{cta}</Button>
      </DialogTrigger>
      <DialogContent className="min-w-[1200px] h-5/6">
        <ScrollArea>
          <Pricing />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
