"use client"

import type { ButtonProps } from "@builderai/ui/button"
import { Button } from "@builderai/ui/button"
import { LoadingAnimation } from "@builderai/ui/loading-animation"
import { cn } from "@builderai/ui/utils"
import { useFormStatus } from "react-dom"

interface SubmitButtonProps extends ButtonProps {
  isSubmitting?: boolean
  isDisabled?: boolean
  label: string
  component?: "default" | "spinner"
}

export const SubmitButton = ({
  variant = "primary",
  isSubmitting,
  isDisabled,
  label,
  onClick,
  className,
  ...props
}: SubmitButtonProps) => {
  const { pending } = useFormStatus()

  const isPending = pending || isSubmitting

  return (
    <Button
      variant={variant}
      type={onClick ? "button" : "submit"}
      disabled={isDisabled || pending}
      className={className}
      onClick={onClick}
      {...props}
    >
      {label}
      {isPending && <LoadingAnimation className={cn("ml-2", className)} />}
    </Button>
  )
}
