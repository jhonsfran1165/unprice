import { useNode } from "@craftjs/core"
import type React from "react"

import { RadioGroup } from "@builderai/ui/radio-group"
import { Slider } from "@builderai/ui/slider"

import { ToolbarDropdown } from "./ToolbarDropdown"
import { ToolbarTextInput } from "./ToolbarTextInput"

export type ToolbarItemProps = {
  prefix?: string
  label?: string
  full?: boolean
  propKey?: string
  index?: number
  children?: React.ReactNode
  type: string
  onChange?: (value: any) => any
}
export const ToolbarItem = ({
  full = false,
  propKey,
  type,
  onChange,
  index,
  ...props
}: ToolbarItemProps) => {
  const {
    actions: { setProp },
    propValue,
  } = useNode((node) => ({
    propValue: node.data.props[propKey],
  }))
  const value = Array.isArray(propValue) ? propValue[index] : propValue

  return (
    <div className="container">
      <div className="mb-2">
        {["text", "color", "bg", "number"].includes(type) ? (
          <ToolbarTextInput
            {...props}
            type={type}
            value={value}
            onChange={(value) => {
              setProp((props: any) => {
                if (Array.isArray(propValue)) {
                  props[propKey][index] = onChange ? onChange(value) : value
                } else {
                  props[propKey] = onChange ? onChange(value) : value
                }
              }, 500)
            }}
          />
        ) : type === "slider" ? (
          <>
            {props.label ? <h4 className="text-sm text-light-gray-2">{props.label}</h4> : null}
            <Slider
              defaultValue={[Number.parseInt(value) || 0]}
              onValueChange={([value]) => {
                setProp((props: any) => {
                  if (Array.isArray(propValue)) {
                    props[propKey][index] = onChange ? onChange(value) : value
                  } else {
                    props[propKey] = onChange ? onChange(value) : value
                  }
                }, 1000)
              }}
            />
          </>
        ) : type === "radio" ? (
          <>
            {props.label ? <h4 className="text-sm text-light-gray-2">{props.label}</h4> : null}
            <RadioGroup
              defaultValue={value}
              onValueChange={(value) => {
                console.log(value)

                setProp((props: any) => {
                  props[propKey] = onChange ? onChange(value) : value
                })
                // setProp((props: any) => {
                //   props[propKey] = onChange ? onChange(value) : value
                // })
              }}
              onChange={(e) => {
                const value = e.target.value
                setProp((props: any) => {
                  props[propKey] = onChange ? onChange(value) : value
                })
              }}
            >
              {props.children}
            </RadioGroup>
          </>
        ) : type === "select" ? (
          <ToolbarDropdown
            value={value || ""}
            onChange={(value) =>
              setProp((props: any) => (props[propKey] = onChange ? onChange(value) : value))
            }
            {...props}
          />
        ) : null}
      </div>
    </div>
  )
}
