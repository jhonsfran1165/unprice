import { Input } from "@builderai/ui/input"
import { Label } from "@builderai/ui/label"
import { cn } from "@builderai/ui/utils"
import { useEffect, useState } from "react"

interface ToolbarItemTextProps<T> {
  label?: string
  value: T
  onChange: (value: T) => void
  className?: string
}

export function ToolbarItemText<T>({
  onChange,
  className,
  value,
  ...props
}: ToolbarItemTextProps<T>) {
  const [inputValue, setInputValue] = useState(value)

  // keep the input value in sync with the prop value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {props.label && <Label className="font-normal text-xs">{props.label}</Label>}
      <Input
        className={"h-7 w-full px-2 font-normal text-xs"}
        value={inputValue as string}
        onChange={(e) => {
          const value = e.target.value as T
          setInputValue(value)
        }}
        onBlur={() => {
          onChange(inputValue)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onChange(inputValue)
          }
        }}
      />
    </div>
  )
}
