import Link from "next/link"

import { AppOrgClaim } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function OrganizationLink({ org }: { org?: AppOrgClaim | null }) {
  return (
    <Link
      className="flex w-[120px] items-center justify-start space-x-3 hover:text-background-textContrast"
      href={`/org/${org?.slug ?? ""}`}
    >
      <Avatar className="h-7 w-7">
        <AvatarImage
          src={org?.image || "https://avatar.vercel.sh/new-org.png"}
          alt={org?.slug}
        />
        <AvatarFallback>{org?.slug?.substring(2)}</AvatarFallback>
      </Avatar>
      <span className="block w-full truncate text-center text-sm font-bold">
        {org?.slug ?? "new org"}
      </span>
    </Link>
  )
}

export default OrganizationLink
