import { Label } from "@unprice/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"
import { cn } from "@unprice/ui/utils"
import { useEffect, useState } from "react"

interface ToolbarItemSelectorProps {
  label?: string
  value: string
  onChange: (value: string) => void
  className?: string
  options: { label: string; value: string }[]
}

// this only receives string values
export function ToolbarItemSelector({
  onChange,
  className,
  value,
  options,
  label,
}: ToolbarItemSelectorProps) {
  const [inputValue, setInputValue] = useState(value)

  // keep the input value in sync with the prop value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {label && <Label className={"font-normal text-xs"}>{label}</Label>}
      <Select
        value={inputValue}
        onValueChange={(e) => {
          setInputValue(e)
          onChange(e)
        }}
      >
        <SelectTrigger id={"provider"} className="h-7 font-normal text-xs">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent align="center">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
