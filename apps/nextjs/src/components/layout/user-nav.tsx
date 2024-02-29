import Link from "next/link"

import { auth } from "@builderai/auth/server"
import { Avatar, AvatarFallback, AvatarImage } from "@builderai/ui/avatar"
import { Button } from "@builderai/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@builderai/ui/dropdown-menu"
import { CreditCard, LogOut, Settings, User } from "@builderai/ui/icons"

import { AUTH_ROUTES } from "~/constants"
import UserNavSkeleton from "./user-nav-skeleton"

export default async function UserNav() {
  const session = await auth()

  if (!session?.user) {
    return <UserNavSkeleton />
  }

  const personalWorkspace = session.user.workspaces.find((wk) => wk.isPersonal)
  const user = session.user

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-6 w-6">
            <AvatarImage
              src={user.image ?? "/placeholder-avatar.svg"}
              alt={user.name ?? ""}
            />
            <AvatarFallback>{user.name?.substring(2)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        align="end"
        forceMount
        side="right"
        sideOffset={20}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="truncate text-sm font-medium leading-none">
              {user.name ?? user.email}
            </p>
            <p className="truncate text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            {/* // TODO: this should redirect to the user's profile */}
            <Link href={`/${personalWorkspace?.slug}/settings`}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/${personalWorkspace?.slug}/billing`}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/${personalWorkspace?.slug}/settings`}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`${AUTH_ROUTES.SIGNOUT}`}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
