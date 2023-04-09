import Link from "next/link"

import { Organization } from "@/lib/types/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function OrganizationLink({
  org,
  isLoading,
}: {
  org?: Organization | null
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Link
        className="flex w-28 items-center justify-start space-x-3 hover:text-background-textContrast md:w-32"
        href={`/`}
      >
        <Avatar className="h-7 w-7">
          <AvatarImage
            src={`https://avatar.vercel.sh/new-org`}
            alt={"New org"}
          />
        </Avatar>
        <span className="block h-4 w-full animate-pulse truncate rounded-lg bg-background-solidHover text-center text-sm font-bold" />
      </Link>
    )
  }

  if (!org) {
    return (
      <Link
        className="flex w-28 items-center justify-start space-x-3 hover:text-background-textContrast md:w-32"
        href={`/`}
      >
        <Avatar className="h-7 w-7">
          {/* TODO: define url image callback */}{" "}
          <Avatar className="h-7 w-7">
            <AvatarImage
              src={`https://avatar.vercel.sh/new-org`}
              alt={"New org"}
            />
          </Avatar>
          <AvatarFallback className="bg-primary-bgSubtle">BA</AvatarFallback>
        </Avatar>
        <span className="block w-full truncate text-center text-sm font-bold">
          {"New Org"}
        </span>
      </Link>
    )
  }

  return (
    <Link
      className="flex w-28 items-center justify-start space-x-3 hover:text-background-textContrast md:w-32"
      href={`/org/${org.slug}`}
    >
      <Avatar className="h-7 w-7">
        <AvatarImage
          src={org.image || `https://avatar.vercel.sh/${org.name}`}
          alt={org.name || ""}
        />
        <AvatarFallback>{org.name.substring(2)}</AvatarFallback>
      </Avatar>
      <span className="block w-full truncate text-center text-sm font-bold">
        {org.name}
      </span>
    </Link>
  )
}

export default OrganizationLink
