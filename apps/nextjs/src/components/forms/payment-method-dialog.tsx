"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@unprice/ui/dialog"
import { useState } from "react"
import { PaymentMethodForm } from "~/components/forms/payment-method-form"

interface PaymentMethodDialogProps {
  customerId: string
  successUrl: string
  cancelUrl: string
  children: React.ReactNode
}

export function PaymentMethodDialog({
  customerId,
  successUrl,
  cancelUrl,
  children,
}: PaymentMethodDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-screen overflow-y-scroll md:max-w-screen-md">
        <DialogHeader>
          <DialogTitle>Payment method form</DialogTitle>

          <DialogDescription>Modify the payment method details below.</DialogDescription>
        </DialogHeader>

        <PaymentMethodForm customerId={customerId} successUrl={successUrl} cancelUrl={cancelUrl} />
      </DialogContent>
    </Dialog>
  )
}
