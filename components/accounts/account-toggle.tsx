"use client"

import { useSupabase } from "@/components/auth/supabase-provider"
import { Icons } from "@/components/shared/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AccountToggle() {
  const { supabase } = useSupabase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* TODO: connect this with profile info */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 rounded-full border hover:border-primary-borderHover"
        >
          {" "}
          <Avatar className="h-7 w-7">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        forceMount
        className="bg-background-bgSubtle w-56"
      >
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-background-line" />
        <DropdownMenuGroup>
          <DropdownMenuItem className="focus:bg-background-bgHover hover:bg-background-bgHover hover:text-background-textContrast">
            <Icons.user className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem className="focus:bg-background-bgHover hover:bg-background-bgHover hover:text-background-textContrast">
            <Icons.billing className="mr-2 h-4 w-4" />
            <span>Billing</span>
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem className="focus:bg-background-bgHover hover:bg-background-bgHover hover:text-background-textContrast">
            <Icons.settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-background-line" />
        <DropdownMenuGroup>
          <DropdownMenuItem className="focus:bg-background-bgHover hover:bg-background-bgHover hover:text-background-textContrast">
            <Icons.users className="mr-2 h-4 w-4" />
            <span>Organization</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="focus:bg-background-bgHover hover:bg-background-bgHover hover:text-background-textContrast">
            <Icons.add className="mr-2 h-4 w-4" />
            <span>New Organization</span>
            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-background-line" />

        <DropdownMenuItem className="focus:bg-background-bgHover hover:bg-background-bgHover hover:text-background-textContrast">
          <Icons.lifeBuoy className="mr-2 h-4 w-4" />
          <span>Support</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-background-line" />
        <DropdownMenuItem
          onClick={async () => {
            await supabase.auth.signOut()
          }}
          className="focus:bg-background-bgHover hover:bg-background-bgHover hover:text-background-textContrast"
        >
          <Icons.logOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
