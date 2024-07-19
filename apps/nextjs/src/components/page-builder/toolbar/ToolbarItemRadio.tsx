import { Label } from "@unprice/ui/label"
import { RadioGroup, RadioGroupItem } from "@unprice/ui/radio-group"
import { cn } from "@unprice/ui/utils"
import { useEffect, useState } from "react"

interface ToolbarItemRadioProps {
  label?: string
  value: string
  onChange: (value: string) => void
  className?: string
  options: { label: string; value: string }[]
}

// this only receives string values
export function ToolbarItemRadio({
  onChange,
  className,
  value,
  options,
  label,
}: ToolbarItemRadioProps) {
  const [inputValue, setInputValue] = useState(value)

  // keep the input value in sync with the prop value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {label && <Label className={"font-normal text-xs"}>{label}</Label>}
      <RadioGroup
        defaultValue={inputValue}
        onValueChange={(newValue: string) => {
          setInputValue(newValue)
          onChange(newValue)
        }}
      >
        {options.map((option) => (
          <div className="flex items-center space-x-2" key={Math.random()}>
            <RadioGroupItem value={option.value} id={option.value} />
            <Label htmlFor={option.value} className="font-normal text-xs">
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}
