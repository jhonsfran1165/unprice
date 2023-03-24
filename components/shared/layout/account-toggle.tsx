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
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
          className="h-9 w-9 rounded-full border hover:border-primary-borderHover"
        >
          {" "}
          <Avatar className="h-8 w-8">
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
          <DropdownMenuItem className="focus:bg-background-bgHover hover:bg-background-bgHover hover:text-background-textContrast">
            <Icons.keyboard className="mr-2 h-4 w-4" />
            <span>Keyboard shortcuts</span>
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-background-line" />
        <DropdownMenuGroup>
          <DropdownMenuItem className="focus:bg-background-bgHover hover:bg-background-bgHover hover:text-background-textContrast">
            <Icons.users className="mr-2 h-4 w-4" />
            <span>Team</span>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.userPlus className="mr-2 h-4 w-4" />
              <span>Invite users</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="bg-background-bgSubtle">
                <DropdownMenuItem className="focus:bg-background-bgHover hover:bg-background-bgHover hover:text-background-textContrast">
                  <Icons.mail className="mr-2 h-4 w-4" />
                  <span>Email</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-background-bgHover hover:bg-background-bgHover hover:text-background-textContrast">
                  <Icons.messageSquare className="mr-2 h-4 w-4" />
                  <span>Message</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-background-line" />
                <DropdownMenuItem className="focus:bg-background-bgHover hover:bg-background-bgHover hover:text-background-textContrast">
                  <Icons.plusCircle className="mr-2 h-4 w-4" />
                  <span>More...</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem className="focus:bg-background-bgHover hover:bg-background-bgHover hover:text-background-textContrast">
            <Icons.add className="mr-2 h-4 w-4" />
            <span>New Team</span>
            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-background-line" />
        <DropdownMenuItem className="focus:bg-background-bgHover hover:bg-background-bgHover hover:text-background-textContrast">
          <Icons.gitHub className="mr-2 h-4 w-4" />
          <span>GitHub</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="focus:bg-background-bgHover hover:bg-background-bgHover hover:text-background-textContrast">
          <Icons.lifeBuoy className="mr-2 h-4 w-4" />
          <span>Support</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Icons.cloud className="mr-2 h-4 w-4" />
          <span>API</span>
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
