import { Button } from "@builderai/ui/button"
import UserProfile from "../layout/user-profile"

import { getSession } from "@builderai/auth/server-rsc"
import { Avatar, AvatarFallback, AvatarImage } from "@builderai/ui/avatar"
import { MoreVertical } from "lucide-react"
import UserNavSkeleton from "../layout/user-nav-skeleton"

export const UserProfileDesktop = async () => {
  const session = await getSession()

  if (!session?.user) {
    return <UserNavSkeleton />
  }

  const user = session.user

  return (
    <UserProfile session={session} align="center">
      <Button variant="ghost" className="flex justify-between">
        <span className="flex items-center space-x-1">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.image ?? "/placeholder-avatar.svg"} alt={user.name ?? ""} />
            <AvatarFallback>{user.name?.substring(2)}</AvatarFallback>
          </Avatar>
          <span className="line-clamp-1">{user.name}</span>
        </span>
        <MoreVertical className="size-5 ml-2" aria-hidden="true" />
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
      <Button variant="ghost" className="h-8 w-8 rounded-full">
        <Avatar className="h-6 w-6">
          <AvatarImage src={user.image ?? "/placeholder-avatar.svg"} alt={user.name ?? ""} />
          <AvatarFallback>{user.name?.substring(2)}</AvatarFallback>
        </Avatar>
      </Button>
    </UserProfile>
  )
}
