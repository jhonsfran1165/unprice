import type React from "react"

import { Button } from "@builderai/ui/button"
import { Label } from "@builderai/ui/label"
import { Trash } from "lucide-react"
import { useState } from "react"


export interface ToolbarItemProps<T> {
  label?: string
  children: (props: {
    value: T
    index: number
  }) => React.ReactNode
  onChange?: (value: T[]) => void
  data: T[]
  className?: string
  size?: "sm" | "md" | "lg"
  options?: { name: string; option: string }[]
}

export function ToolbarItemArray<T>({ data, className, ...props }: ToolbarItemProps<T>) {

  const [fields, setFields] = useState(data)

  if (!Array.isArray(fields)) {
    return null
  }

  return (
    <div className="mb-2 flex w-full flex-col px-4">
      <Label>{props.label}</Label>

      {fields.map((field, i) => (
        <div key={Math.random()} className="flex items-end space-x-1">

          {props.children({
            value: field,
            index: i,
          })}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const newFields = fields.filter(f => f !== field)
              setFields(newFields)
              props.onChange?.(newFields)
            }}
          >
            <Trash className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
