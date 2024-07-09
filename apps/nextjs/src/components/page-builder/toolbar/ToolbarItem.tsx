import { useNode } from "@craftjs/core"
import type React from "react"

import { RadioGroup } from "@builderai/ui/radio-group"
import { Slider } from "@builderai/ui/slider"

import { Input } from "@builderai/ui/input"
import { Label } from "@builderai/ui/label"
import { cn } from "@builderai/ui/utils"
import { useState } from "react"
import { ToolbarDropdown } from "./ToolbarDropdown"

type ToolbarItemType = "text" | "color" | "bg" | "number" | "slider" | "radio" | "select"

export interface ToolbarItemProps<T> {
  prefix?: string
  label?: string
  full?: boolean
  propKey: string
  index?: number
  children?: React.ReactNode
  type: ToolbarItemType
  onChange?: (value: T) => T
  className?: string
  max?: number
  min?: number
  size?: "sm" | "md" | "lg"
  options?: { name: string; option: string }[]
}

export function ToolbarItem<T>({
  full = false,
  propKey,
  type,
  onChange,
  index,
  className,
  ...props
}: ToolbarItemProps<T>) {
  const {
    actions: { setProp },
    propValue,
  } = useNode((node) => ({
    propValue: node.data.props[propKey] as T,
  }))

  const value = Array.isArray(propValue) && index !== undefined ? propValue[index] : propValue

  const [inputValue, setInputValue] = useState<T>(value)

  const handleChange = (newValue: T) => {
    setProp(
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      (props: Record<string, any>) => {
        const updatedValue = onChange ? onChange(newValue) : newValue
        if (Array.isArray(propValue) && index !== undefined) {
          props[propKey][index] = updatedValue
        } else {
          props[propKey] = updatedValue
        }
      },
      500
    )
  }

  const renderInput = () => {
    switch (type) {
      case "number":
      case "text":
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
                  handleChange((e.target as any).value)
                }
              }}
              className={cn("w-full", {
                "h-7 px-2 font-normal text-xs": props.size === "sm",
              })}
            />
          </div>
        )
      case "slider":
        return (
          <div className="flex flex-col gap-2">
            {props.label && (
              <Label
                className={cn("", {
                  "mb-2": full,
                  "font-normal text-xs": props.size === "sm",
                })}
              >
                {props.label} {value}
              </Label>
            )}
            <Slider
              max={props?.max || 100}
              min={props?.min || 0}
              size={props.size || "md"}
              defaultValue={[Number(value) || 0]}
              onValueChange={([sliderValue]) => handleChange(sliderValue as T)}
            />
          </div>
        )
      case "radio":
        return (
          <div className="flex flex-col gap-2">
            {props.label && (
              <Label
                className={cn("", {
                  "mb-2": full,
                  "font-normal text-xs": props.size === "sm",
                })}
              >
                {props.label}
              </Label>
            )}
            <RadioGroup
              defaultValue={value as string}
              onValueChange={(newValue: string) => handleChange(newValue as unknown as T)}
            >
              {props.children}
            </RadioGroup>
          </div>
        )
      case "select":
        return (
          <ToolbarDropdown
            value={value as string}
            onChange={(newValue: string) => handleChange(newValue as unknown as T)}
            label={props.label ?? ""}
            options={props.options || []}
            {...props}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="mb-2 flex w-full flex-col px-4">
      <div className={cn("", className)}>{renderInput()}</div>
    </div>
  )
}
