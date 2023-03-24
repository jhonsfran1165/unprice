import Link from "next/link"

import type { Site } from "@/lib/types/supabase"
import { timeAgo } from "@/lib/utils"
import { Card } from "@/components/shared/card"
import { Icons } from "@/components/shared/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export const SiteCard = ({ site }: { site: Site }) => {
  return (
    <Card>
      <div className="flex items-center space-x-1">
        <div className="flex-1">
          <div className="flex items-center justify-start space-x-3 px-1">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <h2 className="block truncate text-lg font-bold">{site.name}</h2>
          </div>
        </div>

        <Link href={`/org/${site.org_id}/site/${site.id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center justify-center text-base p-2 active:bg-background-bgActive hover:bg-background-bgHover"
          >
            <Icons.externalLink
              className="h-4 w-4 hover:text-background-textContrast"
              aria-hidden="true"
            />
          </Button>
        </Link>
      </div>
      <div className={"h-3 pb-4"}>
        <div className={"font-semibold pl-4"}>{site.subdomain}</div>
      </div>
      <div className={"h-3 text-right pb-4"}>
        <div className={"font-semibold text-xs"}>
          {site?.created_at && timeAgo(new Date(site?.created_at))}
        </div>
      </div>
    </Card>
  )
}
