"use client"

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
import { useSupabase } from "@/components/auth/supabase-provider"
import { Icons } from "@/components/shared/icons"

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
          <Avatar className="h-7 w-7">
            <AvatarImage
              src={"https://avatar.vercel.sh/dadasdasd.png"}
              alt="@shadcn"
            />
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        forceMount
        className="w-56 bg-background-bgSubtle"
      >
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-background-line" />
        <DropdownMenuGroup>
          <DropdownMenuItem className="hover:bg-background-bgHover hover:text-background-textContrast focus:bg-background-bgHover">
            <Icons.user className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-background-bgHover hover:text-background-textContrast focus:bg-background-bgHover">
            <Icons.billing className="mr-2 h-4 w-4" />
            <span>Billing</span>
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-background-bgHover hover:text-background-textContrast focus:bg-background-bgHover">
            <Icons.settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-background-line" />
        <DropdownMenuGroup>
          <DropdownMenuItem className="hover:bg-background-bgHover hover:text-background-textContrast focus:bg-background-bgHover">
            <Icons.users className="mr-2 h-4 w-4" />
            <span>Organization</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-background-bgHover hover:text-background-textContrast focus:bg-background-bgHover">
            <Icons.add className="mr-2 h-4 w-4" />
            <span>New Organization</span>
            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-background-line" />

        <DropdownMenuItem className="hover:bg-background-bgHover hover:text-background-textContrast focus:bg-background-bgHover">
          <Icons.lifeBuoy className="mr-2 h-4 w-4" />
          <span>Support</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-background-line" />
        <DropdownMenuItem
          onClick={async () => {
            await supabase.auth.signOut()
          }}
          className="hover:bg-background-bgHover hover:text-background-textContrast focus:bg-background-bgHover"
        >
          <Icons.logOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
