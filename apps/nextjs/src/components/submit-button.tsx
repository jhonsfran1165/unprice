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
  variant = "default",
  component,
  isSubmitting,
  isDisabled,
  label,
  onClick,
}: SubmitButtonProps) => {
  return (
    <Button
      variant={variant}
      type="submit"
      disabled={isDisabled}
      onClick={onClick}
    >
      {label}
      {isSubmitting && (
        <LoadingAnimation
          className="ml-2"
          variant={variant}
          component={component ?? "default"}
        />
      )}
    </Button>
  )
}
