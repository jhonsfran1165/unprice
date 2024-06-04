import { cn } from "@builderai/ui"
import type { ButtonProps } from "@builderai/ui/button"
import { Button } from "@builderai/ui/button"
import { LoadingAnimation } from "@builderai/ui/loading-animation"

interface SubmitButtonProps extends ButtonProps {
  isSubmitting: boolean
  isDisabled: boolean
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
  return (
    <Button
      variant={variant}
      type={onClick ? "button" : "submit"}
      disabled={isDisabled}
      className={className}
      onClick={onClick}
      {...props}
    >
      {label}
      {isSubmitting && <LoadingAnimation className={cn("ml-2", className)} />}
    </Button>
  )
}
