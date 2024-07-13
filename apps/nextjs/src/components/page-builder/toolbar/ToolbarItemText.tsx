import { Input } from "@builderai/ui/input"
import { Label } from "@builderai/ui/label"
import { cn } from "@builderai/ui/utils"
import { useEffect, useState } from "react"

type ToolbarItemType = "text" | "color" | "bg" | "number" | "slider" | "radio" | "select"

export interface ToolbarItemProps<T> {
  label?: string
  value: T
  onChange: (value: T) => void
  className?: string
  size?: "sm" | "md" | "lg"
}

export function ToolbarItemText<T>({
  onChange,
  className,
  value,
  ...props
}: ToolbarItemProps<T>) {

  const [inputValue, setInputValue] = useState(value)

  // keep the input value in sync with the prop value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  return (
    <div className="flex flex-col gap-2">
      <Label>{props.label}</Label>
      <Input
        value={inputValue as string}
        onChange={(e) => {
          setInputValue(e.target.value as T)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            onChange((e.target as any).value)
          }
        }}
        className={cn("w-full", {
          "h-7 px-2 font-normal text-xs": props.size === "sm",
        })}
      />
    </div>
  )
}
