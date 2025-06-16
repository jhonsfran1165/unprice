import { Button } from "@unprice/ui/button"
import UserProfile from "../layout/user-profile"

import { getSession } from "@unprice/auth/server-rsc"
import { Avatar, AvatarFallback, AvatarImage } from "@unprice/ui/avatar"
import { MoreVertical } from "lucide-react"
import UserNavSkeleton from "../layout/user-nav-skeleton"

export const UserProfileDesktop = async () => {
  const session = await getSession()

  if (!session?.user) {
    return <UserNavSkeleton />
  }

  const user = session.user

  return (
    <UserProfile session={session} align="start">
      <Button variant="ghost" className="flex w-full justify-between">
        <span className="flex items-center space-x-1">
          <Avatar className="h-6 w-6">
            <AvatarImage
              src={user.image || "/placeholder-avatar.svg"}
              alt={user.name || "user-img"}
              key={user.image || "placeholder-avatar"}
            />
            <AvatarFallback>{user.name?.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="line-clamp-1">{user.name}</span>
        </span>
        <MoreVertical className="ml-2 size-4" aria-hidden="true" />
      </Button>
    </UserProfile>
  )
}

export const UserProfileMobile = async () => {
  const session = await getSession()

  if (!session?.user) {
    return <UserNavSkeleton />
  }

  const user = session.user
  return (
    <UserProfile session={session} align="end">
      <Button variant="ghost" className="h-8 w-8 rounded-full border">
        <Avatar className="size-8">
          <AvatarImage
            src={user.image || "/placeholder-avatar.svg"}
            alt={user.name || "user-img"}
            key={user.image || "placeholder-avatar"}
          />
          <AvatarFallback>{user.name?.substring(0, 2)}</AvatarFallback>
        </Avatar>
      </Button>
    </UserProfile>
  )
}
