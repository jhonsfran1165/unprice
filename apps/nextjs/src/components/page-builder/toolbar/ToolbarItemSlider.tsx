import { Label } from "@unprice/ui/label"
import { Slider } from "@unprice/ui/slider"
import { cn } from "@unprice/ui/utils"
import { useEffect, useState } from "react"

interface ToolbarItemSliderProps {
  label?: string
  value: number
  onChange: (value: number) => void
  className?: string
  max: number
  min: number
}

// this only receives number values
export function ToolbarItemSlider({
  onChange,
  className,
  value,
  max,
  min,
  label,
}: ToolbarItemSliderProps) {
  const [inputValue, setInputValue] = useState(value)

  // keep the input value in sync with the prop value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {label && <Label className={"font-normal text-xs"}>{label}</Label>}
      <Slider
        max={max}
        min={min}
        size="sm"
        defaultValue={[inputValue]}
        onValueChange={([sliderValue]) => onChange(sliderValue ?? 0)}
      />
    </div>
  )
}
