import { Button } from "@builderai/ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@builderai/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@builderai/ui/popover"
import { ScrollArea } from "@builderai/ui/scroll-area"
import { Check } from "lucide-react"
import { useState } from "react"

export interface MenuItem {
  name: string
  option: string
}

export const ToolbarDropdown = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: MenuItem[]
}) => {
  const [switcherOpen, setSwitcherOpen] = useState(false)

  return (
    <Popover open={switcherOpen} onOpenChange={setSwitcherOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size={"sm"} className="w-full">
          <div className="flex items-center gap-2">
            <div className="rounded-full size-3 border" style={{ background: value }} />
            <span>{label}</span>
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-38 p-0">
        <Command>
          <CommandList>
            <CommandInput
              className="line-clamp-1"
              placeholder={`Search ${label.toLowerCase()}...`}
            />

            <ScrollArea className="pr-2 h-[200px]">
              <CommandGroup heading={`All ${label.toLowerCase()}...`}>
                {options.map(({ name, option }) => (
                  <CommandItem
                    key={name}
                    onSelect={() => {
                      setSwitcherOpen(false)
                      onChange(option)
                    }}
                    className="rounded-sm flex cursor-pointer items-center justify-between py-1 px-1 text-sm hover:bg-background-bgHover hover:text-background-textContrast"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="rounded-sm border border-background-border size-5 font-medium"
                        style={{ backgroundColor: option }}
                      />
                      <span>{name}</span>
                    </div>
                    {value === option && <Check className="ml-2 h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
