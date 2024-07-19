import Link from "next/link"

import { Avatar, AvatarFallback } from "@unprice/ui/avatar"
import { Button } from "@unprice/ui/button"
import { Skeleton } from "@unprice/ui/skeleton"

export default function UserNavSkeleton() {
  return (
    <Link href="/">
      <Button variant="ghost" className="relative h-8 w-8 rounded">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-transparent">
            <Skeleton className="aspect-square h-full w-full" />
          </AvatarFallback>
        </Avatar>
      </Button>
    </Link>
  )
}
