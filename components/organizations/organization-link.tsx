import Link from "next/link"

import { Organization } from "@/lib/types/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function OrganizationLink({
  org,
  isLoading,
}: {
  isLoading: boolean
  org?: Organization | null
}) {
  if (isLoading || !org) {
    return (
      <Link
        className="flex w-28 md:w-32 space-x-3 items-center justify-start hover:text-background-textContrast"
        href={`/`}
      >
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-primary-bgSubtle">BA</AvatarFallback>
        </Avatar>
        <span className="block w-full h-4 truncate rounded-lg text-sm font-bold text-center bg-background-solidHover animate-pulse" />
      </Link>
    )
  }

  return (
    <Link
      className="flex w-28 md:w-32 space-x-3 items-center justify-start hover:text-background-textContrast"
      href={`/org/${org.slug}`}
    >
      <Avatar className="h-7 w-7">
        <AvatarImage
          src={org.image || "https://github.com/shadcn.png"}
          alt={org.name || ""}
        />
        <AvatarFallback>{org.name.substring(2)}</AvatarFallback>
      </Avatar>
      <span className="block w-full truncate text-sm font-bold text-center">
        {org.name}
      </span>
    </Link>
  )
}

export default OrganizationLink
