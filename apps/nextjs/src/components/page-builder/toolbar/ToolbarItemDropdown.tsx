import { Button } from "@builderai/ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@builderai/ui/command"
import { Label } from "@builderai/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@builderai/ui/popover"
import { ScrollArea } from "@builderai/ui/scroll-area"
import { cn } from "@builderai/ui/utils"
import { Check } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"

interface ToolbarItemDropdownProps {
  label?: string
  value: string
  onChange: (value: string) => void
  className?: string
  options: { name: string; option: string }[]
  trigger?: (value: string, label?: string) => React.ReactNode
  optionChildren?: (props: {
    option: string
    name: string
    index: number
  }) => React.ReactNode
}

export const ToolbarItemDropdown = ({
  onChange,
  className,
  value,
  options,
  label,
  trigger,
  optionChildren,
}: ToolbarItemDropdownProps) => {
  const [inputValue, setInputValue] = useState(value)
  const [switcherOpen, setSwitcherOpen] = useState(false)

  // keep the input value in sync with the prop value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {label && <Label className={"font-normal text-xs"}>{label}</Label>}
      <Popover open={switcherOpen} onOpenChange={setSwitcherOpen}>
        <PopoverTrigger asChild>
          {!trigger ? (
            <Button variant="outline" size={"sm"} className="w-full">
              <div className="flex items-center gap-2">
                <span>{label}</span>
              </div>
            </Button>
          ) : (
            trigger(inputValue, label)
          )}
        </PopoverTrigger>

        <PopoverContent className="w-38 p-0">
          <Command>
            <CommandList>
              <CommandInput
                className="line-clamp-1"
                placeholder={`Search ${label?.toLowerCase()}...`}
              />

              <ScrollArea className="h-[200px] pr-2">
                <CommandGroup heading={`All ${label?.toLowerCase()}...`}>
                  {options.map(({ name, option }) => (
                    <CommandItem
                      key={name}
                      onSelect={() => {
                        setSwitcherOpen(false)
                        setInputValue(option)
                        onChange(option)
                      }}
                      className="flex cursor-pointer items-center justify-between rounded-sm px-1 py-1 text-sm hover:bg-background-bgHover hover:text-background-textContrast"
                    >
                      {optionChildren ? (
                        optionChildren({ name, option, index: 0 })
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="size-5 rounded-sm border border-background-border font-medium" />
                          <span>{name}</span>
                        </div>
                      )}
                      {option === inputValue && <Check className="ml-2 h-4 w-4" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
