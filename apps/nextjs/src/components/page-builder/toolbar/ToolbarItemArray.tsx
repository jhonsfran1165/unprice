import type React from "react"

import { Button } from "@unprice/ui/button"
import { Label } from "@unprice/ui/label"
import { cn } from "@unprice/ui/utils"
import { Trash } from "lucide-react"
import { useEffect, useState } from "react"

import { toastAction } from "~/lib/toast"

export interface ToolbarItemProps<T> {
  label?: string
  children: (props: {
    value: T
    index: number
  }) => React.ReactNode
  onChange?: (value: T[]) => void
  data: T[]
  className?: string
  maxItems: number
}

export function ToolbarItemArray<T>({ data, className, ...props }: ToolbarItemProps<T>) {
  const [fields, setFields] = useState(data)

  useEffect(() => {
    setFields(data)
  }, [data])

  if (!Array.isArray(fields) || fields.length === 0) {
    return null
  }

  return (
    <div className={cn("mb-2 flex w-full flex-col space-y-4", className)}>
      {props.label && <Label className="font-normal text-xs">{props.label}</Label>}

      {fields.map((field, i) => (
        <div key={Math.random()} className="flex items-end space-x-1">
          {props.children({
            value: field,
            index: i,
          })}

          <Button
            size={"sm"}
            variant="ghost"
            onClick={() => {
              // remove the field at index i
              const newFields = fields.filter((_, index) => index !== i)
              setFields(newFields)
              props.onChange?.(newFields)
            }}
          >
            <Trash className="size-4" />
          </Button>
        </div>
      ))}

      <Button
        size={"sm"}
        onClick={() => {
          if (fields.length >= props.maxItems) {
            toastAction("error", "You can't add more items")
            return
          }

          const newFields = [...fields, data[data.length - 1] as T]
          setFields(newFields)
          props.onChange?.(newFields)
        }}
      >
        Add
      </Button>
    </div>
  )
}
