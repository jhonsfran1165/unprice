import { Input } from "@builderai/ui/input"
import { Select } from "@builderai/ui/select"

export const ToolbarDropdown = ({ title, value, onChange, children }: any) => {
  return (
    <>
      <Input>{title}</Input>
      <Select value={value} onValueChange={(e) => onChange(e)}>
        {children}
      </Select>
    </>
  )
}
